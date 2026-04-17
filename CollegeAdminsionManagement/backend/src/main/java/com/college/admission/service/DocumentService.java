package com.college.admission.service;

import com.college.admission.dto.response.DocumentResponse;
import com.college.admission.entity.Application;
import com.college.admission.entity.Document;
import com.college.admission.entity.User;
import com.college.admission.exception.BadRequestException;
import com.college.admission.exception.ResourceNotFoundException;
import com.college.admission.repository.ApplicationRepository;
import com.college.admission.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ApplicationRepository applicationRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    public DocumentResponse uploadDocument(Long applicationId, MultipartFile file, User user) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", applicationId));

        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            String originalName = file.getOriginalFilename();
            String extension = originalName != null && originalName.contains(".")
                    ? originalName.substring(originalName.lastIndexOf(".")) : "";
            String storedName = UUID.randomUUID().toString() + extension;

            Path targetLocation = uploadPath.resolve(storedName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Document document = Document.builder()
                    .fileName(originalName)
                    .fileType(file.getContentType())
                    .filePath(targetLocation.toString())
                    .fileSize(file.getSize())
                    .application(application)
                    .uploadedBy(user)
                    .build();

            document = documentRepository.save(document);

            return DocumentResponse.builder()
                    .id(document.getId())
                    .fileName(document.getFileName())
                    .fileType(document.getFileType())
                    .fileSize(document.getFileSize())
                    .uploadedAt(document.getUploadedAt())
                    .build();

        } catch (IOException e) {
            throw new BadRequestException("Failed to upload file: " + e.getMessage());
        }
    }

    public List<DocumentResponse> getDocumentsByApplication(Long applicationId) {
        return documentRepository.findByApplicationId(applicationId).stream()
                .map(d -> DocumentResponse.builder()
                        .id(d.getId())
                        .fileName(d.getFileName())
                        .fileType(d.getFileType())
                        .fileSize(d.getFileSize())
                        .uploadedAt(d.getUploadedAt())
                        .build())
                .collect(Collectors.toList());
    }
}
