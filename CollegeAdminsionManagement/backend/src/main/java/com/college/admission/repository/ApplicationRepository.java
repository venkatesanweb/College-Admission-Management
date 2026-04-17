package com.college.admission.repository;

import com.college.admission.entity.Application;
import com.college.admission.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long>, JpaSpecificationExecutor<Application> {

    Page<Application> findByStudentId(Long studentId, Pageable pageable);

    List<Application> findByStudentId(Long studentId);

    @Query("SELECT a.course.name, COUNT(a) FROM Application a GROUP BY a.course.name")
    List<Object[]> countApplicationsPerCourse();

    @Query("SELECT a.status, COUNT(a) FROM Application a GROUP BY a.status")
    List<Object[]> countByStatus();

    @Query("SELECT FUNCTION('DATE', a.submittedAt), COUNT(a) FROM Application a WHERE a.submittedAt BETWEEN :start AND :end GROUP BY FUNCTION('DATE', a.submittedAt) ORDER BY FUNCTION('DATE', a.submittedAt)")
    List<Object[]> countDailyApplications(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT FUNCTION('MONTH', a.submittedAt), FUNCTION('YEAR', a.submittedAt), COUNT(a) FROM Application a GROUP BY FUNCTION('YEAR', a.submittedAt), FUNCTION('MONTH', a.submittedAt) ORDER BY FUNCTION('YEAR', a.submittedAt), FUNCTION('MONTH', a.submittedAt)")
    List<Object[]> countMonthlyApplications();

    long countByStatus(ApplicationStatus status);

    @Query("SELECT a.course.name, a.status, COUNT(a) FROM Application a GROUP BY a.course.name, a.status")
    List<Object[]> countByCourseAndStatus();
}
