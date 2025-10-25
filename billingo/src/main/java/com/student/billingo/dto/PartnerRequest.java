package com.student.billingo.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class PartnerRequest {

    @NotEmpty(message = "A név nem lehet üres")
    private String name;

    @NotEmpty(message = "Az email nem lehet üres")
    @Email(message = "Érvénytelen email formátum")
    private String email;

    @NotEmpty(message = "Az irányítószám nem lehet üres")
    @Pattern(regexp = "^\\d{4}$", message = "Az irányítószám pontosan 4 számjegyből kell álljon")
    private String postalCode;

    @NotEmpty(message = "A város nem lehet üres")
    private String city;

    @NotEmpty(message = "A cím nem lehet üres")
    private String address;

    private String taxCode;

    @NotEmpty(message = "A hallgatók nevei nem lehetnek üresek")
    private List<String> studentNames;

    @NotNull(message = "Az ár nem lehet null")
    private Integer price;

    @NotNull(message = "Az aktív állapot nem lehet null")
    private Boolean isActive;
}
