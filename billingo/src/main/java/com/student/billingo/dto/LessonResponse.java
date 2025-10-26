package com.student.billingo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class LessonResponse {
    private Integer id;
    private LocalDateTime date;
    private String dateWithDuration;
    private String description;
    private String subject;
    private Double duration;
    private String type;
    private Boolean isRetained;
    private String partnerName;
    private String studentName;
}
