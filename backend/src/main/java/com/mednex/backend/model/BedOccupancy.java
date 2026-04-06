package com.mednex.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "bed_occupancy")
@Data
@NoArgsConstructor
public class BedOccupancy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_id", nullable = false)
    private String tenantId;

    @Column(name = "department", nullable = false)
    private String department;

    @Column(name = "total_beds", nullable = false)
    private Integer totalBeds;

    @Column(name = "occupied_beds", nullable = false)
    private Integer occupiedBeds;

    @Column(name = "available_beds", nullable = false)
    private Integer availableBeds;

    @Column(name = "occupancy_rate")
    private Double occupancyRate;

    @Column(name = "record_date", nullable = false)
    private LocalDate recordDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        this.createdAt = LocalDateTime.now();
        if (this.recordDate == null) this.recordDate = LocalDate.now();
        if (this.totalBeds != null && this.totalBeds > 0) {
            this.availableBeds = this.totalBeds - (this.occupiedBeds != null ? this.occupiedBeds : 0);
            this.occupancyRate = (this.occupiedBeds * 100.0) / this.totalBeds;
        }
    }
}
