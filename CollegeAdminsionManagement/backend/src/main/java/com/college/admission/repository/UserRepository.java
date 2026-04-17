package com.college.admission.repository;

import com.college.admission.entity.User;
import com.college.admission.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(Role role);
    List<User> findByFullNameContainingIgnoreCase(String name);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT u FROM User u WHERE u.role = 'ADMIN' AND u.department IN (SELECT a.course.department FROM Application a WHERE a.student.id = :studentId)")
    List<User> findAdminsForStudent(@org.springframework.data.repository.query.Param("studentId") Long studentId);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT a.student FROM Application a WHERE a.course.department = :department")
    List<User> findStudentsForAdminDepartment(@org.springframework.data.repository.query.Param("department") String department);
}
