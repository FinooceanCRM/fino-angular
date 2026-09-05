<?php

namespace App\Enums;

/**
 * Application roles.
 *
 * Hierarchy: super_admin -> manager -> relationship_manager -> employee.
 * Connector, Banker, Telecaller, Affiliate and Accounts are standalone roles
 * outside the hierarchy.
 */
enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case Manager = 'manager';
    case RelationshipManager = 'relationship_manager';
    case Employee = 'employee';
    case Connector = 'connector';
    case Banker = 'banker';
    case Telecaller = 'telecaller';
    case Affiliate = 'affiliate';
    /**
     * Finance/accounts staff. Created by Super Admin (like Banker/
     * Telecaller — no self-service signup), standalone outside the
     * reporting hierarchy. Reads across every payee's commissions,
     * payouts and the accounting ledger; never edits a loan lead.
     */
    case Accounts = 'accounts';

    public function label(): string
    {
        return match ($this) {
            self::SuperAdmin => 'Super Admin',
            self::Manager => 'Manager',
            self::RelationshipManager => 'Relationship Manager',
            self::Employee => 'Employee',
            self::Connector => 'Connector',
            self::Banker => 'Banker',
            self::Telecaller => 'Telecaller',
            self::Affiliate => 'Affiliate',
            self::Accounts => 'Accounts',
        };
    }

    /**
     * Roles that may be a direct parent of this role.
     *
     * @return array<int, self>
     */
    public function allowedParents(): array
    {
        return match ($this) {
            self::SuperAdmin => [],
            self::Manager => [self::SuperAdmin],
            self::RelationshipManager => [self::Manager],
            self::Employee => [self::RelationshipManager],
            self::Connector => [],
            self::Banker => [],
            self::Telecaller => [],
            self::Affiliate => [],
            self::Accounts => [],
        };
    }

    /**
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $role): string => $role->value, self::cases());
    }
}
