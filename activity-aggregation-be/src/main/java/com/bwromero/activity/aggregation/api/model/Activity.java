package com.bwromero.activity.aggregation.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.ZonedDateTime;

// ... existing code ...
@Entity
@Table(name = "activity", indexes = {
        @Index(name = "idx_activity_agg", columnList = "project_id, employee_id, date")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
}
