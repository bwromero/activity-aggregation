package com.bwromero.activity.aggregation.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
public class Activity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private Project project;

    @ManyToOne
    private Employee employee;

    private ZonedDateTime date;
    private Integer hours;

    public Activity(Project project, Employee employee, ZonedDateTime date, Integer hours) {
        this.project = project;
        this.employee = employee;
        this.date = date;
        this.hours = hours;
    }
}
