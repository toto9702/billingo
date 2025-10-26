package com.student.billingo.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Lesson {

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    private Integer id;

    private LocalDateTime date;

    private String dateWithDuration;

    private String description;

    private String subject;

    private Double duration;

    private String type;

    private Boolean isRetained;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partner_id", nullable = false)
    private Partner partner;


}
