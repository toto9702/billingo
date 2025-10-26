package com.student.billingo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LessonStatisticsResponse {
    private String label;
    private Double retainedAmount;
    private Double notRetainedAmount;
    private Double totalAmount;
}
