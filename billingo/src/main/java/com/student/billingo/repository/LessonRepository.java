package com.student.billingo.repository;

import com.student.billingo.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, Integer> {

    List<Lesson> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);

}
