package com.student.billingo.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class LessonRequest {

    @NotNull(message = "A partner neve nem lehet null")
    @NotEmpty(message = "A partner neve nem lehet üres")
    private String partnerName;

    @NotNull(message = "A hallgató neve nem lehet null")
    @NotEmpty(message = "A hallgató neve nem lehet üres")
    private String studentName;

    @NotNull(message = "A dátum nem lehet null")
    private LocalDateTime date;

    @NotNull(message = "A tantárgy nem lehet null")
    @NotEmpty(message = "A tantárgy nem lehet üres")
    private String subject;

    @NotNull(message = "Az időtartam nem lehet null")
    @Positive(message = "Az időtartam pozitív szám kell legyen")
    private Double duration;

    @NotNull(message = "A típus nem lehet null")
    @NotEmpty(message = "A típus nem lehet üres")
    private String type;

    @NotNull(message = "Az órának a megtartása nem lehet kitöltetlen")
    private Boolean isRetained;
}
