package com.student.billingo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class UpdateRetainRequest {

    @NotNull(message = "A megtartás státusz nem lehet null")
    private Boolean isRetained;
}
