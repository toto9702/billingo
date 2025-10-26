package com.student.billingo.repository;

import com.student.billingo.entity.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, Integer> {

    Optional<Partner> findByEmail(String email);

    @Query("SELECT p FROM Partner p WHERE p.name = :partnerName " +
            "AND p.studentNamesJson LIKE CONCAT('%\"', :studentName, '\"%')")
    Optional<Partner> findByNameAndStudentName(
            @Param("partnerName") String partnerName,
            @Param("studentName") String studentName
    );
}
