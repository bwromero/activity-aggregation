package com.bwromero.activity.aggregation.api.repository;

import com.bwromero.activity.aggregation.api.model.Activity;
import com.bwromero.activity.aggregation.api.model.ActivityResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Long> {

    @Query("""
           SELECT new com.bwromero.activity.aggregation.api.model.ActivityResponse(
               (CASE WHEN :groupByProject = true THEN a.project.name ELSE null END),
               (CASE WHEN :groupByEmployee = true THEN a.employee.name ELSE null END),
               (CASE WHEN :groupByDate = true THEN CAST(a.date AS string) ELSE null END),
               CAST(SUM(a.hours) AS int)
           )
           FROM Activity a
           GROUP BY 
               (CASE WHEN :groupByProject = true THEN a.project.name ELSE '1' END),
               (CASE WHEN :groupByEmployee = true THEN a.employee.name ELSE '1' END),
               (CASE WHEN :groupByDate = true THEN CAST(a.date AS string) ELSE '1' END)
           """)
    Page<ActivityResponse> findAggregated(
            @Param("groupByProject") boolean groupByProject,
            @Param("groupByEmployee") boolean groupByEmployee,
            @Param("groupByDate") boolean groupByDate,
            Pageable pageable
    );
}
