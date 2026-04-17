package com.college.admission.service;

import com.college.admission.dto.request.ApplicationRequest;
import com.college.admission.dto.response.ApplicationResponse;
import com.college.admission.dto.response.DocumentResponse;
import com.college.admission.entity.Application;
import com.college.admission.entity.Course;
import com.college.admission.entity.User;
import com.college.admission.enums.ApplicationStatus;
import com.college.admission.exception.BadRequestException;
import com.college.admission.exception.ResourceNotFoundException;
import com.college.admission.repository.ApplicationRepository;
import com.college.admission.repository.CourseRepository;
import com.college.admission.specification.ApplicationSpecification;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final CourseRepository courseRepository;
    private final NotificationService notificationService;
    private final AuditLogService auditLogService;
    private final EmailService emailService;

    @Transactional
    public ApplicationResponse createApplication(ApplicationRequest request, User student) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        Application application = Application.builder()
                .student(student)
                .course(course)
                .marks(request.getMarks() != null ? request.getMarks() : 0.0) // keep safe
                .personalStatement(request.getPersonalStatement())
                .previousSchool(request.getPreviousSchool())
                .guardianPhone(request.getGuardianPhone())
                .gender(request.getGender())
                .dateOfBirth(request.getDateOfBirth())
                .age(request.getAge())
                .mobileNumber(request.getMobileNumber())
                .emailId(request.getEmailId())
                .aadhaarNumber(request.getAadhaarNumber())
                .epicNumber(request.getEpicNumber())
                .nationality(request.getNationality())
                .religion(request.getReligion())
                .community(request.getCommunity())
                .caste(request.getCaste())
                .permanentAddressLine(request.getPermanentAddressLine())
                .permanentDistrict(request.getPermanentDistrict())
                .permanentState(request.getPermanentState())
                .permanentPincode(request.getPermanentPincode())
                .isCommunicationSame(request.getIsCommunicationSame())
                .communicationAddressLine(request.getCommunicationAddressLine())
                .communicationDistrict(request.getCommunicationDistrict())
                .communicationState(request.getCommunicationState())
                .communicationPincode(request.getCommunicationPincode())
                .fatherName(request.getFatherName())
                .motherName(request.getMotherName())
                .parentOccupation(request.getParentOccupation())
                .annualIncome(request.getAnnualIncome())
                .incomeCertificateNumber(request.getIncomeCertificateNumber())
                .parentMobileNumber(request.getParentMobileNumber())
                .admissionCategory(request.getAdmissionCategory())
                .branchSpecialization(request.getBranchSpecialization())
                .modeOfStudy(request.getModeOfStudy())
                .hscSchoolName(request.getHscSchoolName())
                .hscBoard(request.getHscBoard())
                .hscRegisterNumber(request.getHscRegisterNumber())
                .hscYearOfPassing(request.getHscYearOfPassing())
                .hscPhysicsMarks(request.getHscPhysicsMarks())
                .hscChemistryMarks(request.getHscChemistryMarks())
                .hscMathsMarks(request.getHscMathsMarks())
                .hscTotalMarks(request.getHscTotalMarks())
                .hscCutoff(request.getHscCutoff())
                .diplomaCollege(request.getDiplomaCollege())
                .diplomaBranch(request.getDiplomaBranch())
                .diplomaRegisterNumber(request.getDiplomaRegisterNumber())
                .diplomaYearOfPassing(request.getDiplomaYearOfPassing())
                .diplomaPercentage(request.getDiplomaPercentage())
                .ugDegree(request.getUgDegree())
                .ugCollege(request.getUgCollege())
                .ugUniversity(request.getUgUniversity())
                .ugYearOfPassing(request.getUgYearOfPassing())
                .ugPercentage(request.getUgPercentage())
                .pgDegree(request.getPgDegree())
                .pgSpecialization(request.getPgSpecialization())
                .pgMarks(request.getPgMarks())
                .pgResearchDetails(request.getPgResearchDetails())
                .tcNumber(request.getTcNumber())
                .isFirstGraduate(request.getIsFirstGraduate())
                .firstGraduateCertificateNumber(request.getFirstGraduateCertificateNumber())
                .isDifferentlyAbled(request.getIsDifferentlyAbled())
                .isExServiceman(request.getIsExServiceman())
                .hasSportsQuota(request.getHasSportsQuota())
                .isRegisteredInTnPortal(request.getIsRegisteredInTnPortal())
                .tnRegistrationNumber(request.getTnRegistrationNumber())
                .paymentMode(request.getPaymentMode())
                .transactionId(request.getTransactionId())
                .isDeclared(request.getIsDeclared())
                .studentSignatureName(request.getStudentSignatureName())
                .parentSignatureName(request.getParentSignatureName())
                .signatureDate(request.getSignatureDate())
                .status(ApplicationStatus.SUBMITTED)
                .build();

        application = applicationRepository.save(application);

        notificationService.createNotification(student, "Application Submitted",
                "Your application for " + course.getName() + " has been submitted successfully.", "APPLICATION");

        auditLogService.log("APPLICATION_SUBMITTED", "Application submitted successfully by: " + student.getFullName(),
                student, "Application", application.getId());

        emailService.sendApplicationSubmittedEmail(
                student.getEmail(),
                student.getFullName(),
                course.getName(),
                course.getCollegeName(),
                course.getDepartment()
        );

        return mapToResponse(application);
    }

    @Transactional
    public ApplicationResponse updateApplication(Long id, ApplicationRequest request, User student) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        
        if (!application.getStudent().getId().equals(student.getId())) {
            throw new BadRequestException("You can only edit your own application");
        }
        
        if (application.getEditCount() != null && application.getEditCount() >= 3) {
            throw new BadRequestException("Upload Limit Exceeded. You can only edit your application a maximum of 3 times.");
        }
        
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        populateApplicationFields(application, request, course);
        
        application.setEditCount((application.getEditCount() != null ? application.getEditCount() : 0) + 1);
        
        application = applicationRepository.save(application);
        
        auditLogService.log("APPLICATION_UPDATED", "Application updated successfully",
                student, "Application", application.getId());
                
        return mapToResponse(application);
    }

    @Transactional
    public ApplicationResponse updateApplicationByAdmin(Long id, ApplicationRequest request, User admin) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        populateApplicationFields(application, request, course);

        application = applicationRepository.save(application);

        auditLogService.log("APPLICATION_UPDATED_BY_ADMIN", "Application details updated by admin for student: " + application.getStudent().getFullName(),
                admin, "Application", application.getId());

        return mapToResponse(application);
    }

    private void populateApplicationFields(Application application, ApplicationRequest request, Course course) {
        application.setCourse(course);
        application.setMarks(request.getMarks() != null ? request.getMarks() : 0.0);
        application.setPersonalStatement(request.getPersonalStatement());
        application.setPreviousSchool(request.getPreviousSchool());
        application.setGuardianPhone(request.getGuardianPhone());
        application.setGender(request.getGender());
        application.setDateOfBirth(request.getDateOfBirth());
        application.setAge(request.getAge());
        application.setMobileNumber(request.getMobileNumber());
        application.setEmailId(request.getEmailId());
        application.setAadhaarNumber(request.getAadhaarNumber());
        application.setEpicNumber(request.getEpicNumber());
        application.setNationality(request.getNationality());
        application.setReligion(request.getReligion());
        application.setCommunity(request.getCommunity());
        application.setCaste(request.getCaste());
        application.setPermanentAddressLine(request.getPermanentAddressLine());
        application.setPermanentDistrict(request.getPermanentDistrict());
        application.setPermanentState(request.getPermanentState());
        application.setPermanentPincode(request.getPermanentPincode());
        application.setIsCommunicationSame(request.getIsCommunicationSame());
        application.setCommunicationAddressLine(request.getCommunicationAddressLine());
        application.setCommunicationDistrict(request.getCommunicationDistrict());
        application.setCommunicationState(request.getCommunicationState());
        application.setCommunicationPincode(request.getCommunicationPincode());
        application.setFatherName(request.getFatherName());
        application.setMotherName(request.getMotherName());
        application.setParentOccupation(request.getParentOccupation());
        application.setAnnualIncome(request.getAnnualIncome());
        application.setIncomeCertificateNumber(request.getIncomeCertificateNumber());
        application.setParentMobileNumber(request.getParentMobileNumber());
        application.setAdmissionCategory(request.getAdmissionCategory());
        application.setBranchSpecialization(request.getBranchSpecialization());
        application.setModeOfStudy(request.getModeOfStudy());
        application.setHscSchoolName(request.getHscSchoolName());
        application.setHscBoard(request.getHscBoard());
        application.setHscRegisterNumber(request.getHscRegisterNumber());
        application.setHscYearOfPassing(request.getHscYearOfPassing());
        application.setHscPhysicsMarks(request.getHscPhysicsMarks());
        application.setHscChemistryMarks(request.getHscChemistryMarks());
        application.setHscMathsMarks(request.getHscMathsMarks());
        application.setHscTotalMarks(request.getHscTotalMarks());
        application.setHscCutoff(request.getHscCutoff());
        application.setDiplomaCollege(request.getDiplomaCollege());
        application.setDiplomaBranch(request.getDiplomaBranch());
        application.setDiplomaRegisterNumber(request.getDiplomaRegisterNumber());
        application.setDiplomaYearOfPassing(request.getDiplomaYearOfPassing());
        application.setDiplomaPercentage(request.getDiplomaPercentage());
        application.setUgDegree(request.getUgDegree());
        application.setUgCollege(request.getUgCollege());
        application.setUgUniversity(request.getUgUniversity());
        application.setUgYearOfPassing(request.getUgYearOfPassing());
        application.setUgPercentage(request.getUgPercentage());
        application.setPgDegree(request.getPgDegree());
        application.setPgSpecialization(request.getPgSpecialization());
        application.setPgMarks(request.getPgMarks());
        application.setPgResearchDetails(request.getPgResearchDetails());
        application.setTcNumber(request.getTcNumber());
        application.setIsFirstGraduate(request.getIsFirstGraduate());
        application.setFirstGraduateCertificateNumber(request.getFirstGraduateCertificateNumber());
        application.setIsDifferentlyAbled(request.getIsDifferentlyAbled());
        application.setIsExServiceman(request.getIsExServiceman());
        application.setHasSportsQuota(request.getHasSportsQuota());
        application.setIsRegisteredInTnPortal(request.getIsRegisteredInTnPortal());
        application.setTnRegistrationNumber(request.getTnRegistrationNumber());
        application.setPaymentMode(request.getPaymentMode());
        application.setTransactionId(request.getTransactionId());
        application.setIsDeclared(request.getIsDeclared());
        application.setStudentSignatureName(request.getStudentSignatureName());
        application.setParentSignatureName(request.getParentSignatureName());
        application.setSignatureDate(request.getSignatureDate());
    }

    public Page<ApplicationResponse> getStudentApplications(Long studentId, Pageable pageable) {
        return applicationRepository.findByStudentId(studentId, pageable)
                .map(this::mapToResponse);
    }

    public ApplicationResponse getApplicationById(Long id) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));
        return mapToResponse(application);
    }

    public Page<ApplicationResponse> getAllApplications(Pageable pageable) {
        return applicationRepository.findAll(pageable)
                .map(this::mapToResponse);
    }

    public Page<ApplicationResponse> getFilteredApplications(
            String studentName, Double minMarks, Double maxMarks,
            Long courseId, ApplicationStatus status,
            LocalDateTime startDate, LocalDateTime endDate,
            String search, String collegeName, String admissionCategory,
            Pageable pageable) {

        Specification<Application> spec = ApplicationSpecification.withFilters(
                studentName, minMarks, maxMarks, courseId, status, startDate, endDate, search, collegeName, admissionCategory);

        return applicationRepository.findAll(spec, pageable)
                .map(this::mapToResponse);
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(Long id, ApplicationStatus status, String remarks, User reviewer) {
        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Application", "id", id));

        application.setStatus(status);
        application.setRemarks(remarks);
        application.setReviewedAt(LocalDateTime.now());
        application.setReviewedBy(reviewer);

        if (status == ApplicationStatus.ACCEPTED) {
            Course course = application.getCourse();
            if (course.getAvailableSeats() <= 0) {
                throw new BadRequestException("No seats available for this course");
            }
            course.setAvailableSeats(course.getAvailableSeats() - 1);
            courseRepository.save(course);
        }

        application = applicationRepository.save(application);

        notificationService.createNotification(application.getStudent(),
                "Application " + status.name(),
                "Your application for " + application.getCourse().getName() + " has been " + status.name().toLowerCase() + ".",
                "APPLICATION_STATUS");

        if (status == ApplicationStatus.ACCEPTED || status == ApplicationStatus.REJECTED) {
            emailService.sendApplicationStatusEmail(
                application.getStudent().getEmail(),
                application.getStudent().getFullName(),
                application.getCourse().getName(),
                application.getCourse().getCollegeName(),
                application.getCourse().getDepartment(),
                status.name(),
                remarks
            );
        }

        auditLogService.log("APPLICATION_" + status.name(),
                "Application " + status.name().toLowerCase() + " for: " + application.getStudent().getFullName(),
                reviewer, "Application", application.getId());

        return mapToResponse(application);
    }

    private ApplicationResponse mapToResponse(Application app) {
        return ApplicationResponse.builder()
                .id(app.getId())
                .studentName(app.getStudent().getFullName())
                .studentEmail(app.getStudent().getEmail())
                .studentId(app.getStudent().getId())
                .collegeName(app.getCourse().getCollegeName())
                .courseName(app.getCourse().getName())
                .courseId(app.getCourse().getId())
                .status(app.getStatus().name())
                .marks(app.getMarks())
                .personalStatement(app.getPersonalStatement())
                .previousSchool(app.getPreviousSchool())
                .guardianPhone(app.getGuardianPhone())
                .gender(app.getGender())
                .dateOfBirth(app.getDateOfBirth())
                .age(app.getAge())
                .mobileNumber(app.getMobileNumber())
                .emailId(app.getEmailId())
                .aadhaarNumber(app.getAadhaarNumber())
                .epicNumber(app.getEpicNumber())
                .nationality(app.getNationality())
                .religion(app.getReligion())
                .community(app.getCommunity())
                .caste(app.getCaste())
                .permanentAddressLine(app.getPermanentAddressLine())
                .permanentDistrict(app.getPermanentDistrict())
                .permanentState(app.getPermanentState())
                .permanentPincode(app.getPermanentPincode())
                .isCommunicationSame(app.getIsCommunicationSame())
                .communicationAddressLine(app.getCommunicationAddressLine())
                .communicationDistrict(app.getCommunicationDistrict())
                .communicationState(app.getCommunicationState())
                .communicationPincode(app.getCommunicationPincode())
                .fatherName(app.getFatherName())
                .motherName(app.getMotherName())
                .parentOccupation(app.getParentOccupation())
                .annualIncome(app.getAnnualIncome())
                .incomeCertificateNumber(app.getIncomeCertificateNumber())
                .parentMobileNumber(app.getParentMobileNumber())
                .admissionCategory(app.getAdmissionCategory())
                .branchSpecialization(app.getBranchSpecialization())
                .modeOfStudy(app.getModeOfStudy())
                .hscSchoolName(app.getHscSchoolName())
                .hscBoard(app.getHscBoard())
                .hscRegisterNumber(app.getHscRegisterNumber())
                .hscYearOfPassing(app.getHscYearOfPassing())
                .hscPhysicsMarks(app.getHscPhysicsMarks())
                .hscChemistryMarks(app.getHscChemistryMarks())
                .hscMathsMarks(app.getHscMathsMarks())
                .hscTotalMarks(app.getHscTotalMarks())
                .hscCutoff(app.getHscCutoff())
                .diplomaCollege(app.getDiplomaCollege())
                .diplomaBranch(app.getDiplomaBranch())
                .diplomaRegisterNumber(app.getDiplomaRegisterNumber())
                .diplomaYearOfPassing(app.getDiplomaYearOfPassing())
                .diplomaPercentage(app.getDiplomaPercentage())
                .ugDegree(app.getUgDegree())
                .ugCollege(app.getUgCollege())
                .ugUniversity(app.getUgUniversity())
                .ugYearOfPassing(app.getUgYearOfPassing())
                .ugPercentage(app.getUgPercentage())
                .pgDegree(app.getPgDegree())
                .pgSpecialization(app.getPgSpecialization())
                .pgMarks(app.getPgMarks())
                .pgResearchDetails(app.getPgResearchDetails())
                .tcNumber(app.getTcNumber())
                .isFirstGraduate(app.getIsFirstGraduate())
                .firstGraduateCertificateNumber(app.getFirstGraduateCertificateNumber())
                .isDifferentlyAbled(app.getIsDifferentlyAbled())
                .isExServiceman(app.getIsExServiceman())
                .hasSportsQuota(app.getHasSportsQuota())
                .isRegisteredInTnPortal(app.getIsRegisteredInTnPortal())
                .tnRegistrationNumber(app.getTnRegistrationNumber())
                .paymentMode(app.getPaymentMode())
                .transactionId(app.getTransactionId())
                .isDeclared(app.getIsDeclared())
                .studentSignatureName(app.getStudentSignatureName())
                .parentSignatureName(app.getParentSignatureName())
                .signatureDate(app.getSignatureDate())
                .remarks(app.getRemarks())
                .editCount(app.getEditCount())
                .submittedAt(app.getSubmittedAt())
                .reviewedAt(app.getReviewedAt())
                .reviewedBy(app.getReviewedBy() != null ? app.getReviewedBy().getFullName() : null)
                .documents(app.getDocuments() != null ? app.getDocuments().stream()
                        .map(d -> DocumentResponse.builder()
                                .id(d.getId())
                                .fileName(d.getFileName())
                                .fileType(d.getFileType())
                                .fileSize(d.getFileSize())
                                .uploadedAt(d.getUploadedAt())
                                .build())
                        .collect(Collectors.toList()) : null)
                .build();
    }
}
