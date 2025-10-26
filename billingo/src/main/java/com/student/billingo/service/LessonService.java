package com.student.billingo.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.student.billingo.dto.LessonRequest;
import com.student.billingo.dto.LessonResponse;
import com.student.billingo.dto.LessonStatisticsResponse;
import com.student.billingo.entity.Lesson;
import com.student.billingo.entity.Partner;
import com.student.billingo.exception.JsonConversionException;
import com.student.billingo.exception.LessonNotFoundException;
import com.student.billingo.exception.PartnerNotFoundException;
import com.student.billingo.repository.LessonRepository;
import com.student.billingo.repository.PartnerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class LessonService {

    @Autowired
    private LessonRepository lessonRepository;

    @Autowired
    private PartnerRepository partnerRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private static final double HOURLY_RATE = 4000.0;


    @Transactional
    public void saveLesson(LessonRequest lessonRequest) {
        Partner partner = partnerRepository.findByNameAndStudentName(
                lessonRequest.getPartnerName(),
                lessonRequest.getStudentName()
        ).orElseThrow(() -> new PartnerNotFoundException(
                "Nem található partner: " + lessonRequest.getPartnerName() +
                        " hallgatóval: " + lessonRequest.getStudentName()
        ));
        Lesson lesson = new Lesson();
        lesson.setDate(lessonRequest.getDate());
        lesson.setDateWithDuration(formatLessonDateRange(lessonRequest.getDate(), lessonRequest.getDuration()));
        lesson.setDescription(String.format("%s %s %s",
                lessonRequest.getStudentName(),
                lessonRequest.getSubject(),
                "magánóra"
        ));
        lesson.setDuration(lessonRequest.getDuration());
        lesson.setSubject(lessonRequest.getSubject());
        lesson.setType(lessonRequest.getType());
        lesson.setIsRetained(lessonRequest.getIsRetained());
        partner.addLesson(lesson);
        lessonRepository.save(lesson);
    }

    public List<LessonResponse> getLessonsBetweenDates(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(23, 59, 59);

        return lessonRepository.findByDateBetween(start, end).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateRetainStatus(Integer id, Boolean isRetained) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new LessonNotFoundException("Nem található óra ezzel az ID-val: " + id));

        lesson.setIsRetained(isRetained);
        lessonRepository.save(lesson);
    }

    @Transactional
    public void updateLesson(Integer id, LessonRequest lessonRequest) {
        Lesson lesson = lessonRepository.findById(id)
                .orElseThrow(() -> new LessonNotFoundException("Nem található óra ezzel az ID-val: " + id));

        Partner partner = partnerRepository.findByNameAndStudentName(
                lessonRequest.getPartnerName(),
                lessonRequest.getStudentName()
        ).orElseThrow(() -> new PartnerNotFoundException(
                "Nem található partner: " + lessonRequest.getPartnerName() +
                        " hallgatóval: " + lessonRequest.getStudentName()
        ));

        lesson.setDate(lessonRequest.getDate());
        lesson.setDateWithDuration(formatLessonDateRange(lessonRequest.getDate(), lessonRequest.getDuration()));
        lesson.setDescription(String.format("%s %s %s",
                lessonRequest.getStudentName(),
                lessonRequest.getSubject(),
                "magánóra"
        ));
        lesson.setDuration(lessonRequest.getDuration());
        lesson.setSubject(lessonRequest.getSubject());
        lesson.setType(lessonRequest.getType());
        lesson.setIsRetained(lessonRequest.getIsRetained());
        lesson.setPartner(partner);

        lessonRepository.save(lesson);
    }

    @Transactional
    public void deleteLesson(Integer id) {
        if (!lessonRepository.existsById(id)) {
            throw new LessonNotFoundException("Nem található óra ezzel az ID-val: " + id);
        }
        lessonRepository.deleteById(id);
    }

    public List<String> getAllUniqueStudentNames() {
        return partnerRepository.findAll().stream()
                .flatMap(partner -> getStudentNamesList(partner.getStudentNamesJson()).stream())
                .distinct()
                .sorted()
                .collect(Collectors.toList());
    }

    public List<String> getPartnersByStudentName(String studentName) {
        return partnerRepository.findAll().stream()
                .filter(partner -> getStudentNamesList(partner.getStudentNamesJson()).contains(studentName))
                .map(Partner::getName)
                .sorted()
                .collect(Collectors.toList());
    }

    private LessonResponse convertToResponse(Lesson lesson) {
        LessonResponse response = new LessonResponse();
        response.setId(lesson.getId());

        if (lesson.getDate() != null) {
            response.setDate(lesson.getDate());
        }
        response.setDateWithDuration(lesson.getDateWithDuration());
        response.setDescription(lesson.getDescription());
        response.setSubject(lesson.getSubject());
        response.setDuration(lesson.getDuration());
        response.setType(lesson.getType());
        response.setIsRetained(lesson.getIsRetained());
        response.setPartnerName(lesson.getPartner().getName());

        // Tanuló nevének kinyerése a description-ből
        String desc = lesson.getDescription();
        String studentName = desc.substring(0, desc.indexOf(" "));
        response.setStudentName(studentName);

        return response;
    }

    public List<LessonStatisticsResponse> getYearlyStatistics(int year) {
        LocalDateTime startOfYear = LocalDateTime.of(year, 1, 1, 0, 0);
        LocalDateTime endOfYear = LocalDateTime.of(year, 12, 31, 23, 59, 59);

        List<Lesson> lessons = lessonRepository.findByDateBetween(startOfYear, endOfYear);

        Map<Integer, LessonStatisticsResponse> monthlyStats = new LinkedHashMap<>();

        // Inicializálás minden hónapra
        for (int month = 1; month <= 12; month++) {
            String monthName = getMonthName(month);
            monthlyStats.put(month, new LessonStatisticsResponse(monthName, 0.0, 0.0, 0.0));
        }

        // Órák feldolgozása
        for (Lesson lesson : lessons) {
            int month = lesson.getDate().getMonthValue();
            double amount = lesson.getDuration() * HOURLY_RATE;

            LessonStatisticsResponse stats = monthlyStats.get(month);

            if (lesson.getIsRetained()) {
                stats.setRetainedAmount(stats.getRetainedAmount() + amount);
            } else {
                stats.setNotRetainedAmount(stats.getNotRetainedAmount() + amount);
            }

            stats.setTotalAmount(stats.getRetainedAmount() + stats.getNotRetainedAmount());
        }

        return new ArrayList<>(monthlyStats.values());
    }

    // ✅ HAVI STATISZTIKA (diákonkénti bontás)
    public List<LessonStatisticsResponse> getMonthlyStatistics(int year, int month) {
        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = yearMonth.atEndOfMonth().atTime(23, 59, 59);

        List<Lesson> lessons = lessonRepository.findByDateBetween(startOfMonth, endOfMonth);

        Map<String, LessonStatisticsResponse> studentStats = new LinkedHashMap<>();

        for (Lesson lesson : lessons) {
            String studentName = lesson.getPartner().getName(); //TODO tanuló neve
            double amount = lesson.getDuration() * HOURLY_RATE;

            studentStats.putIfAbsent(studentName, new LessonStatisticsResponse(studentName, 0.0, 0.0, 0.0));

            LessonStatisticsResponse stats = studentStats.get(studentName);

            if (lesson.getIsRetained()) {
                stats.setRetainedAmount(stats.getRetainedAmount() + amount);
            } else {
                stats.setNotRetainedAmount(stats.getNotRetainedAmount() + amount);
            }

            stats.setTotalAmount(stats.getRetainedAmount() + stats.getNotRetainedAmount());
        }

        return new ArrayList<>(studentStats.values());
    }

    private String getMonthName(int month) {
        String[] monthNames = {
                "Január", "Február", "Március", "Április", "Május", "Június",
                "Július", "Augusztus", "Szeptember", "Október", "November", "December"
        };
        return monthNames[month - 1];
    }


    private String formatLessonDateRange(LocalDateTime startDate, Double duration) {
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");

        LocalDateTime endDate = startDate.plusMinutes((long) (duration * 60));

        return String.format("%s %s-%s - %.2f óra",
                startDate.format(dateFormatter),
                startDate.format(timeFormatter),
                endDate.format(timeFormatter),
                duration
        );
    }

    private List<String> getStudentNamesList(String studentNamesJson) {
        try {
            return objectMapper.readValue(studentNamesJson, new TypeReference<List<String>>() {});
        } catch (JsonProcessingException e) {
            throw new JsonConversionException("Hiba történt a JSON visszaalakítása során", e);
        }
    }

}
