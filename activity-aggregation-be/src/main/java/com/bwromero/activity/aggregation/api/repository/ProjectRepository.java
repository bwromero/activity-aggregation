package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, Long> {
}
