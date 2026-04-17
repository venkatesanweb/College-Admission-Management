package com.college.admission.specification;

import com.college.admission.entity.Application;
import com.college.admission.enums.ApplicationStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ApplicationSpecification {

    public static Specification<Application> withFilters(
            String studentName,
            Double minMarks,
            Double maxMarks,
            Long courseId,
            ApplicationStatus status,
            LocalDateTime startDate,
            LocalDateTime endDate,
            String search,
            String collegeName,
            String admissionCategory
    ) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (studentName != null && !studentName.isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("student").get("fullName")),
                        "%" + studentName.toLowerCase() + "%"
                ));
            }

            if (minMarks != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("marks"), minMarks));
            }

            if (maxMarks != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("marks"), maxMarks));
            }

            if (courseId != null) {
                predicates.add(criteriaBuilder.equal(root.get("course").get("id"), courseId));
            }

            if (status != null) {
                predicates.add(criteriaBuilder.equal(root.get("status"), status));
            }

            if (collegeName != null && !collegeName.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("course").get("collegeName"), collegeName));
            }

            if (admissionCategory != null && !admissionCategory.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("admissionCategory"), admissionCategory));
            }

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("submittedAt"), startDate));
            }

            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("submittedAt"), endDate));
            }

            if (search != null && !search.isBlank()) {
                String searchLower = "%" + search.toLowerCase() + "%";
                Predicate namePredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("student").get("fullName")), searchLower);
                Predicate emailPredicate = criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("student").get("email")), searchLower);
                predicates.add(criteriaBuilder.or(namePredicate, emailPredicate));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
