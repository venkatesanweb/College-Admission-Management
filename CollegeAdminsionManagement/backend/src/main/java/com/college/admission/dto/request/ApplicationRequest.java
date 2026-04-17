package com.college.admission.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class ApplicationRequest {
    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotNull(message = "Marks are required")
    @Positive(message = "Marks must be positive")
    private Double marks;

    private String personalStatement;
    private String previousSchool;
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
}
