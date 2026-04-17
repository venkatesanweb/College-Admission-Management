package com.college.admission.service;

import com.college.admission.enums.ApplicationStatus;
import com.college.admission.repository.ApplicationRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.PdfPCell;
import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;
import com.opencsv.CSVWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.OutputStreamWriter;
import java.time.LocalDateTime;
import java.util.*;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ApplicationRepository applicationRepository;

    public Map<String, Long> getApplicationsPerCourse() {
        List<Object[]> results = applicationRepository.countApplicationsPerCourse();
        Map<String, Long> data = new LinkedHashMap<>();
        for (Object[] row : results) {
            data.put((String) row[0], (Long) row[1]);
        }
        return data;
    }

    public Map<String, Long> getStatusDistribution() {
        List<Object[]> results = applicationRepository.countByStatus();
        Map<String, Long> data = new LinkedHashMap<>();
        for (Object[] row : results) {
            data.put(((ApplicationStatus) row[0]).name(), (Long) row[1]);
        }
        return data;
    }

    public List<Map<String, Object>> getDailyTrends(LocalDateTime start, LocalDateTime end) {
        List<Object[]> results = applicationRepository.countDailyApplications(start, end);
        return results.stream().map(row -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("date", row[0].toString());
            entry.put("count", row[1]);
            return entry;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getMonthlyTrends() {
        List<Object[]> results = applicationRepository.countMonthlyApplications();
        return results.stream().map(row -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("month", row[0]);
            entry.put("year", row[1]);
            entry.put("count", row[2]);
            return entry;
        }).collect(Collectors.toList());
    }

    public Map<String, Object> getSummaryStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("total", applicationRepository.count());
        stats.put("submitted", applicationRepository.countByStatus(ApplicationStatus.SUBMITTED));
        stats.put("underReview", applicationRepository.countByStatus(ApplicationStatus.UNDER_REVIEW));
        stats.put("accepted", applicationRepository.countByStatus(ApplicationStatus.ACCEPTED));
        stats.put("rejected", applicationRepository.countByStatus(ApplicationStatus.REJECTED));
        return stats;
    }

    public Map<String, Map<String, Long>> getCourseStatusBreakdown() {
        List<Object[]> results = applicationRepository.countByCourseAndStatus();
        Map<String, Map<String, Long>> data = new LinkedHashMap<>();
        for (Object[] row : results) {
            String course = (String) row[0];
            String status = ((ApplicationStatus) row[1]).name();
            Long count = (Long) row[2];
            data.computeIfAbsent(course, k -> new LinkedHashMap<>()).put(status, count);
        }
        return data;
    }

    public byte[] generateCsvReport() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        CSVWriter writer = new CSVWriter(new OutputStreamWriter(baos));

        writer.writeNext(new String[]{"Course", "Total Applications", "Accepted", "Rejected", "Under Review", "Submitted"});

        Map<String, Map<String, Long>> breakdown = getCourseStatusBreakdown();
        for (Map.Entry<String, Map<String, Long>> entry : breakdown.entrySet()) {
            Map<String, Long> statuses = entry.getValue();
            writer.writeNext(new String[]{
                    entry.getKey(),
                    String.valueOf(statuses.values().stream().mapToLong(Long::longValue).sum()),
                    String.valueOf(statuses.getOrDefault("ACCEPTED", 0L)),
                    String.valueOf(statuses.getOrDefault("REJECTED", 0L)),
                    String.valueOf(statuses.getOrDefault("UNDER_REVIEW", 0L)),
                    String.valueOf(statuses.getOrDefault("SUBMITTED", 0L))
            });
        }

        writer.flush();
        writer.close();
        return baos.toByteArray();
    }

    public byte[] generatePdfReport() throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        com.itextpdf.text.Document document = new com.itextpdf.text.Document(PageSize.A4);
        PdfWriter.getInstance(document, baos);
        document.open();

        // Title
        Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, BaseColor.DARK_GRAY);
        Paragraph title = new Paragraph("College Admission Report", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);

        // Date
        Font dateFont = FontFactory.getFont(FontFactory.HELVETICA, 10, BaseColor.GRAY);
        Paragraph date = new Paragraph("Generated: " + LocalDateTime.now().toString(), dateFont);
        date.setAlignment(Element.ALIGN_CENTER);
        date.setSpacingAfter(20);
        document.add(date);

        // Summary
        Map<String, Object> summary = getSummaryStats();
        Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14, BaseColor.DARK_GRAY);
        document.add(new Paragraph("Summary Statistics", headerFont));
        document.add(new Paragraph(" "));

        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 11);
        for (Map.Entry<String, Object> s : summary.entrySet()) {
            document.add(new Paragraph(s.getKey() + ": " + s.getValue(), bodyFont));
        }
        document.add(new Paragraph(" "));

        // Course breakdown table
        document.add(new Paragraph("Course-wise Breakdown", headerFont));
        document.add(new Paragraph(" "));

        PdfPTable table = new PdfPTable(6);
        table.setWidthPercentage(100);
        Stream.of("Course", "Total", "Accepted", "Rejected", "Under Review", "Submitted")
                .forEach(col -> {
                    PdfPCell cell = new PdfPCell(new Phrase(col, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
                    cell.setBackgroundColor(new BaseColor(52, 73, 94));
                    cell.setPadding(8);
                    cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                    Font whiteFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
                    cell.setPhrase(new Phrase(col, whiteFont));
                    table.addCell(cell);
                });

        Map<String, Map<String, Long>> breakdown = getCourseStatusBreakdown();
        for (Map.Entry<String, Map<String, Long>> entry : breakdown.entrySet()) {
            Map<String, Long> statuses = entry.getValue();
            long total = statuses.values().stream().mapToLong(Long::longValue).sum();
            table.addCell(new PdfPCell(new Phrase(entry.getKey(), bodyFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(total), bodyFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(statuses.getOrDefault("ACCEPTED", 0L)), bodyFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(statuses.getOrDefault("REJECTED", 0L)), bodyFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(statuses.getOrDefault("UNDER_REVIEW", 0L)), bodyFont)));
            table.addCell(new PdfPCell(new Phrase(String.valueOf(statuses.getOrDefault("SUBMITTED", 0L)), bodyFont)));
        }

        document.add(table);
        document.close();
        return baos.toByteArray();
    }
}
