package com.college.admission.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApplicationResponse {
    private Long id;
    private String studentName;
    private String studentEmail;
    private Long studentId;
    private String collegeName;
    private String courseName;
    private Long courseId;
    private String status;
    private Double marks;
    private String personalStatement;
    private String previousSchool;
    private String guardianName;
    private String guardianPhone;

    // --- 1. Basic Details ---
    private String gender;
    private String dateOfBirth;
    private Integer age;
    private String mobileNumber;
    private String emailId;
    private String aadhaarNumber;
    private String epicNumber;
    private String nationality;
    private String religion;
    private String community;
    private String caste;

    // --- 2. Address Details ---
    private String permanentAddressLine;
    private String permanentDistrict;
    private String permanentState;
    private String permanentPincode;
    private Boolean isCommunicationSame;
    private String communicationAddressLine;
    private String communicationDistrict;
    private String communicationState;
    private String communicationPincode;

    // --- 3. Parent / Guardian Details ---
    private String fatherName;
    private String motherName;
    private String parentOccupation;
    private Double annualIncome;
    private String incomeCertificateNumber;
    private String parentMobileNumber;

    // --- 4 & 5. Admission Details ---
    private String admissionCategory;
    private String branchSpecialization;
    private String modeOfStudy;

    // --- 6. Academic Details ---
    // HSC
    private String hscSchoolName;
    private String hscBoard;
    private String hscRegisterNumber;
    private String hscYearOfPassing;
    private Double hscPhysicsMarks;
    private Double hscChemistryMarks;
    private Double hscMathsMarks;
    private Double hscTotalMarks;
    private Double hscCutoff;

    // Diploma
    private String diplomaCollege;
    private String diplomaBranch;
    private String diplomaRegisterNumber;
    private String diplomaYearOfPassing;
    private Double diplomaPercentage;

    // UG
    private String ugDegree;
    private String ugCollege;
    private String ugUniversity;
    private String ugYearOfPassing;
    private Double ugPercentage;

    // PG
    private String pgDegree;
    private String pgSpecialization;
    private Double pgMarks;
    private String pgResearchDetails;

    // --- 7. Documents (Handled by Document relation) ---
    private String tcNumber; // Mentioned specifically

    // --- 8. Reservation ---
    private Boolean isFirstGraduate;
    private String firstGraduateCertificateNumber;
    private Boolean isDifferentlyAbled;
    private Boolean isExServiceman;
    private Boolean hasSportsQuota;

    // --- 9. TN Admission ---
    private Boolean isRegisteredInTnPortal;
    private String tnRegistrationNumber;

    // --- 10. Application Fee ---
    private String paymentMode;
    private String transactionId;

    // --- 11. Declaration ---
    private Boolean isDeclared;
    private String studentSignatureName;
    private String parentSignatureName;
    private String signatureDate;

    private Integer editCount;

    private String remarks;
    private LocalDateTime submittedAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;
    private List<DocumentResponse> documents;
}
