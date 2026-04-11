package com.mednex.backend.repository;

import com.mednex.backend.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByUserId(Long userId);

    List<UserRole> findByUserIdAndTenantId(Long userId, String tenantId);

    boolean existsByUserIdAndRoleIdAndTenantId(Long userId, Long roleId, String tenantId);

    void deleteByUserIdAndTenantId(Long userId, String tenantId);

    @Query("SELECT ur.roleId FROM UserRole ur WHERE ur.userId = :userId AND ur.tenantId = :tenantId")
    List<Long> findRoleIdsByUserIdAndTenantId(@Param("userId") Long userId,
                                              @Param("tenantId") String tenantId);
}
