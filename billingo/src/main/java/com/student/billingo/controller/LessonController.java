package com.student.billingo.controller;

import com.student.billingo.dto.LessonRequest;
import com.student.billingo.dto.LessonResponse;
import com.student.billingo.dto.LessonStatisticsResponse;
import com.student.billingo.dto.UpdateRetainRequest;
import com.student.billingo.service.LessonService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/lesson")
@CrossOrigin(origins = "*")
public class LessonController {

    private static final Logger logger = LoggerFactory.getLogger(LessonController.class);

    @Autowired
    private LessonService lessonService;

    /**
     * Új óra mentése
     */
    @PostMapping("/save")
    public ResponseEntity<String> save(@Valid @RequestBody LessonRequest lesson) {
        logger.info("Új óra mentése partnerhez: {}", lesson.getPartnerName());
        lessonService.saveLesson(lesson);
        return ResponseEntity.ok("Óra sikeresen mentve!");
    }

    /**
     * Havi órák lekérése naptárhoz
     */
    @GetMapping("/calendar")
    public ResponseEntity<List<LessonResponse>> getMonthlyLessons(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        logger.info("Órák lekérése: {} - {}", startDate, endDate);
        List<LessonResponse> lessons = lessonService.getLessonsBetweenDates(startDate, endDate);
        return ResponseEntity.ok(lessons);
    }

    /**
     * Óra megtartás státusz frissítése
     */
    @PatchMapping("/{id}/retain")
    public ResponseEntity<String> updateRetainStatus(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateRetainRequest request
    ) {
        logger.info("Óra {} megtartás státusz frissítése: {}", id, request.getIsRetained());
        lessonService.updateRetainStatus(id, request.getIsRetained());
        return ResponseEntity.ok("Státusz sikeresen frissítve!");
    }

    /**
     * Óra szerkesztése
     */
    @PutMapping("/{id}")
    public ResponseEntity<String> updateLesson(
            @PathVariable Integer id,
            @Valid @RequestBody LessonRequest lesson
    ) {
        logger.info("Óra {} szerkesztése", id);
        lessonService.updateLesson(id, lesson);
        return ResponseEntity.ok("Óra sikeresen frissítve!");
    }

    /**
     * Óra törlése
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteLesson(@PathVariable Integer id) {
        logger.info("Óra {} törlése", id);
        lessonService.deleteLesson(id);
        return ResponseEntity.ok("Óra sikeresen törölve!");
    }

    /**
     * Összes egyedi tanuló név lekérése
     */
    @GetMapping("/students")
    public ResponseEntity<List<String>> getAllStudentNames() {
        logger.info("Összes tanuló név lekérése");
        List<String> students = lessonService.getAllUniqueStudentNames();
        return ResponseEntity.ok(students);
    }

    /**
     * Adott tanulóhoz tartozó partnerek lekérése
     */
    @GetMapping("/partners-by-student")
    public ResponseEntity<List<String>> getPartnersByStudent(@RequestParam String studentName) {
        logger.info("Partnerek lekérése tanulóhoz: {}", studentName);
        List<String> partners = lessonService.getPartnersByStudentName(studentName);
        return ResponseEntity.ok(partners);
    }

    @GetMapping("/statistics/yearly")
    public ResponseEntity<List<LessonStatisticsResponse>> getYearlyStatistics(@RequestParam int year) {
        return ResponseEntity.ok(lessonService.getYearlyStatistics(year));
    }

    @GetMapping("/statistics/monthly")
    public ResponseEntity<List<LessonStatisticsResponse>> getMonthlyStatistics(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(lessonService.getMonthlyStatistics(year, month));
    }


}
