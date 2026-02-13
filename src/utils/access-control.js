/**
 * Access Control & Authorization
 * Role-based and Feature-based Access Control (RBAC & FBAC)
 */

/**
 * User Roles
 */
export const UserRoles = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  PREMIUM_USER: 'premium_user',
  USER: 'user',
  GUEST: 'guest',
};

/**
 * Permissions
 */
export const Permissions = {
  // User Management
  CREATE_USER: 'create:user',
  READ_USER: 'read:user',
  UPDATE_USER: 'update:user',
  DELETE_USER: 'delete:user',
  MANAGE_ROLES: 'manage:roles',

  // Bookings
  CREATE_BOOKING: 'create:booking',
  READ_BOOKING: 'read:booking',
  UPDATE_BOOKING: 'update:booking',
  CANCEL_BOOKING: 'cancel:booking',
  REFUND_BOOKING: 'refund:booking',

  // Payments
  PROCESS_PAYMENT: 'process:payment',
  REFUND_PAYMENT: 'refund:payment',
  VIEW_TRANSACTIONS: 'view:transactions',

  // Movie Management
  CREATE_MOVIE: 'create:movie',
  UPDATE_MOVIE: 'update:movie',
  DELETE_MOVIE: 'delete:movie',

  // Theater Management
  MANAGE_THEATERS: 'manage:theaters',
  MANAGE_SHOWS: 'manage:shows',
  MANAGE_SEATS: 'manage:seats',

  // Content
  CREATE_OFFER: 'create:offer',
  MANAGE_CONTENT: 'manage:content',

  // Analytics
  VIEW_ANALYTICS: 'view:analytics',
  EXPORT_REPORTS: 'export:reports',

  // System
  SYSTEM_ADMIN: 'system:admin',
  VIEW_LOGS: 'view:logs',
};

/**
 * Role-Permission Mapping
 */
export const rolePermissions = {
  [UserRoles.ADMIN]: [
    Permissions.MANAGE_ROLES,
    Permissions.CREATE_USER,
    Permissions.READ_USER,
    Permissions.UPDATE_USER,
    Permissions.DELETE_USER,
    Permissions.VIEW_ANALYTICS,
    Permissions.EXPORT_REPORTS,
    Permissions.SYSTEM_ADMIN,
    Permissions.VIEW_LOGS,
    Permissions.CREATE_MOVIE,
    Permissions.UPDATE_MOVIE,
    Permissions.DELETE_MOVIE,
    Permissions.MANAGE_THEATERS,
    Permissions.MANAGE_SHOWS,
    Permissions.MANAGE_SEATS,
    Permissions.REFUND_PAYMENT,
  ],

  [UserRoles.MODERATOR]: [
    Permissions.READ_USER,
    Permissions.UPDATE_MOVIE,
    Permissions.MANAGE_SHOWS,
    Permissions.MANAGE_SEATS,
    Permissions.VIEW_ANALYTICS,
  ],

  [UserRoles.PREMIUM_USER]: [
    Permissions.CREATE_BOOKING,
    Permissions.READ_BOOKING,
    Permissions.UPDATE_BOOKING,
    Permissions.CANCEL_BOOKING,
    Permissions.PROCESS_PAYMENT,
  ],

  [UserRoles.USER]: [
    Permissions.CREATE_BOOKING,
    Permissions.READ_BOOKING,
    Permissions.PROCESS_PAYMENT,
  ],

  [UserRoles.GUEST]: [
    Permissions.READ_BOOKING, // Only own bookings after login
  ],
};

/**
 * Access Control Service
 */
export class AccessControlService {
  constructor(user = null) {
    this.user = user;
    this.permissions = this.user && this.user.role
      ? rolePermissions[this.user.role] || []
      : [];
  }

  /**
   * Set user
   */
  setUser(user) {
    this.user = user;
    this.permissions = user && user.role
      ? rolePermissions[user.role] || []
      : [];
  }

  /**
   * Check if user has permission
   */
  hasPermission(permission) {
    if (!this.user) return false;
    return this.permissions.includes(permission);
  }

  /**
   * Check if user has any permission
   */
  hasAnyPermission(permissions) {
    if (!this.user) return false;
    return permissions.some(p => this.permissions.includes(p));
  }

  /**
   * Check if user has all permissions
   */
  hasAllPermissions(permissions) {
    if (!this.user) return false;
    return permissions.every(p => this.permissions.includes(p));
  }

  /**
   * Check if user has role
   */
  hasRole(role) {
    if (!this.user) return false;
    return this.user.role === role;
  }

  /**
   * Check if user has any role
   */
  hasAnyRole(roles) {
    if (!this.user) return false;
    return roles.includes(this.user.role);
  }

  /**
   * Can access resource
   */
  canAccess(resource, action) {
    const permission = `${action}:${resource}`;
    return this.hasPermission(permission);
  }

  /**
   * Can perform action
   */
  canPerformAction(action) {
    return this.hasPermission(action);
  }

  /**
   * Get user permissions
   */
  getPermissions() {
    return this.permissions;
  }

  /**
   * Is authenticated
   */
  isAuthenticated() {
    return !!this.user && !!this.user.token;
  }

  /**
   * Is admin
   */
  isAdmin() {
    return this.hasRole(UserRoles.ADMIN);
  }

  /**
   * Is moderator or admin
   */
  isModerator() {
    return this.hasAnyRole([UserRoles.ADMIN, UserRoles.MODERATOR]);
  }
}

/**
 * Feature Flags
 */
export const featureFlags = {
  NEW_UI: import.meta.env.VITE_ENV === 'PRODUCTION' ? true : true,
  DARK_MODE: true,
  ADVANCED_SEARCH: true,
  PREMIUM_FEATURES: true,
  ANALYTICS: import.meta.env.VITE_ENV === 'PRODUCTION',
  BETA_FEATURES: import.meta.env.VITE_ENV !== 'PRODUCTION',
  OFFLINE_MODE: false,
};

/**
 * Feature Manager
 */
export class FeatureManager {
  constructor() {
    this.features = { ...featureFlags };
    this.userFeatures = {};
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(featureName, user = null) {
    // Check user-specific feature flags
    if (user && this.userFeatures[user.id]) {
      if (featureName in this.userFeatures[user.id]) {
        return this.userFeatures[user.id][featureName];
      }
    }

    // Check global feature flags
    return this.features[featureName] || false;
  }

  /**
   * Enable feature
   */
  enableFeature(featureName) {
    this.features[featureName] = true;
  }

  /**
   * Disable feature
   */
  disableFeature(featureName) {
    this.features[featureName] = false;
  }

  /**
   * Set user feature flag
   */
  setUserFeature(userId, featureName, enabled) {
    if (!this.userFeatures[userId]) {
      this.userFeatures[userId] = {};
    }
    this.userFeatures[userId][featureName] = enabled;
  }

  /**
   * Get features for user
   */
  getUserFeatures(user) {
    return Object.keys(this.features).reduce((acc, feature) => {
      acc[feature] = this.isEnabled(feature, user);
      return acc;
    }, {});
  }
}

/**
 * Data Access Control
 */
export class DataAccessControl {
  /**
   * Filter data based on user permissions
   */
  static filterData(data, user, accessRules) {
    if (!user) return [];
    if (user.role === UserRoles.ADMIN) return data;

    return data.filter(item => {
      const rules = accessRules[item.id] || accessRules.default;
      return this._checkRules(rules, user);
    });
  }

  /**
   * Check access rules
   */
  static _checkRules(rules, user) {
    if (typeof rules === 'function') {
      return rules(user);
    }

    if (rules.roles) {
      return rules.roles.includes(user.role);
    }

    if (rules.owner) {
      return rules.owner === user.id;
    }

    return false;
  }

  /**
   * Mask sensitive data
   */
  static maskSensitiveData(data, fieldsToMask = []) {
    const masked = { ...data };
    fieldsToMask.forEach(field => {
      if (field in masked) {
        const value = String(masked[field]);
        masked[field] = value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
      }
    });
    return masked;
  }
}

/**
 * Audit Log
 */
export class AuditLog {
  constructor() {
    this.logs = [];
  }

  /**
   * Log action
   */
  logAction(action, actor, resource, status = 'success', details = {}) {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      actor: actor.id,
      actorRole: actor.role,
      resource,
      status,
      details,
      ipAddress: this._getIPAddress(),
      userAgent: navigator.userAgent,
    };

    this.logs.push(log);

    if (status === 'failure') {
      console.warn('Audit Log - Failure:', log);
    }

    return log;
  }

  /**
   * Get logs
   */
  getLogs(filter = {}) {
    return this.logs.filter(log => {
      if (filter.action && log.action !== filter.action) return false;
      if (filter.actor && log.actor !== filter.actor) return false;
      if (filter.status && log.status !== filter.status) return false;
      return true;
    });
  }

  /**
   * Export logs
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Get IP address (placeholder)
   */
  _getIPAddress() {
    return 'CLIENT_IP';
  }
}

// Create singleton instances
export const accessControl = new AccessControlService();
export const featureManager = new FeatureManager();
export const auditLog = new AuditLog();

export default {
  accessControl,
  featureManager,
  auditLog,
  AccessControlService,
  FeatureManager,
  DataAccessControl,
  AuditLog,
  UserRoles,
  Permissions,
};
