package com.student.billingo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Entity
@Getter
@Setter
public class Partner {

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    private Integer id;

    private String name;

    private String email;

    private String postalCode;

    private String city;

    private String address;

    private String taxCode;

    @Column(columnDefinition = "TEXT")
    private String studentNamesJson;

    private Integer price;

    private Boolean isActive;
}
