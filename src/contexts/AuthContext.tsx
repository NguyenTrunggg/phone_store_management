"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import {
  FirebaseUser as UserDocument,
  hasPermission,
  canAccessResource,
  PermissionCheckResult,
  CreateUserInput,
  ChangePasswordInput,
} from "@/lib/firebase/models/user.model";
import { UserRoleType } from "@/constants";

// =============================================================================
// AUTH CONTEXT TYPES
// =============================================================================

interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: UserRoleType;
  isActive: boolean;
  permissions: string[];
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserSession {
  user: AuthUser;
  accessToken: string;
  expiresAt: number;
}

interface AuthContextType {
  // Current user state
  user: AuthUser | null;
  userDocument: UserDocument | null;
  loading: boolean;
  initializing: boolean;

  // Authentication methods
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  register: (userData: CreateUserInput) => Promise<AuthUser>;

  // Password management
  resetPassword: (email: string) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;

  // User profile management
  refreshUser: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserDocument>) => Promise<void>;

  // Permission checks
  hasPermission: (permission: string) => boolean;
  canAccess: (
    resource: string,
    action: string,
    resourceData?: any
  ) => PermissionCheckResult;
  isRole: (role: UserRoleType | UserRoleType[]) => boolean;

  // Session management
  getSession: () => UserSession | null;
  isAuthenticated: () => boolean;
  isActive: () => boolean;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

// =============================================================================
// CONTEXT CREATION
// =============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// =============================================================================
// AUTH PROVIDER COMPONENT
// =============================================================================

export function AuthProvider({ children }: AuthProviderProps) {
  // State management
  const [user, setUser] = useState<AuthUser | null>(null);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  const createAuthUser = useCallback(
    (firebaseUser: FirebaseUser, userDoc: UserDocument): AuthUser => {
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: userDoc.displayName,
        role: userDoc.role,
        isActive: userDoc.isActive,
        permissions: userDoc.permissions,
      };
    },
    []
  );

  const updateLastLogin = useCallback(
    async (userId: string) => {
      try {
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
          lastLoginAt: Timestamp.now(),
          totalLogins: (userDocument?.totalLogins || 0) + 1,
          updatedAt: Timestamp.now(),
        });
      } catch (error) {
        console.error("Failed to update last login:", error);
      }
    },
    [userDocument?.totalLogins]
  );

  // =============================================================================
  // AUTHENTICATION METHODS
  // =============================================================================

  const login = useCallback(
    async (credentials: LoginCredentials): Promise<AuthUser> => {
      setLoading(true);
      try {
        // Sign in with Firebase Auth
        const result = await signInWithEmailAndPassword(
          auth,
          credentials.email,
          credentials.password
        );
        const firebaseUser = result.user;

        // Get user document from Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          throw new Error(
            "User profile not found. Please contact administrator."
          );
        }

        const userDoc = userSnap.data() as UserDocument;

        // Check if user is active
        if (!userDoc.isActive) {
          await signOut(auth);
          throw new Error(
            "Account is deactivated. Please contact administrator."
          );
        }

        // Check if user is deleted
        if (userDoc.isDeleted) {
          await signOut(auth);
          throw new Error("Account not found. Please contact administrator.");
        }

        // Check if account is locked
        if (
          userDoc.accountLockedUntil &&
          userDoc.accountLockedUntil.toDate() > new Date()
        ) {
          await signOut(auth);
          const lockUntil = userDoc.accountLockedUntil
            .toDate()
            .toLocaleString();
          throw new Error(
            `Account is locked until ${lockUntil}. Please contact administrator.`
          );
        }

        // Update last login
        await updateLastLogin(firebaseUser.uid);

        // Create auth user object
        const authUser = createAuthUser(firebaseUser, userDoc);

        // Update state
        setUser(authUser);
        setUserDocument(userDoc);

        return authUser;
      } catch (error: any) {
        console.error("Login failed:", error);
        throw new Error(error.message || "Login failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [createAuthUser, updateLastLogin]
  );

  const logout = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setUserDocument(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw new Error("Logout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (userData: CreateUserInput): Promise<AuthUser> => {
      setLoading(true);
      try {
        // Create Firebase Auth user
        const result = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
        const firebaseUser = result.user;

        // Create user document in Firestore
        const userDoc: UserDocument = {
          id: firebaseUser.uid,
          email: userData.email,
          displayName: userData.displayName,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          role: userData.role,
          permissions: [], // Will be populated by Cloud Function
          customPermissions: [],
          employeeId: userData.employeeId,
          department: userData.department,
          position: userData.position,
          assignedStores: userData.assignedStores || [],
          primaryStore: userData.primaryStore,
          canAccessAllStores: userData.role === "admin",
          isActive: true,
          isEmailVerified: false,
          isPhoneVerified: false,
          totalLogins: 0,
          twoFactorEnabled: false,
          preferences: {
            theme: "light",
            language: "vi",
            notifications: {
              email: true,
              sms: false,
              push: true,
              lowStock: true,
              newOrders: true,
              returns: true,
            },
            dashboard: {
              defaultView: "overview",
              widgets: ["sales", "inventory", "orders"],
            },
          },
          performance:
            userData.role === "sales_staff"
              ? {
                  currentMonthSales: 0,
                  lastMonthSales: 0,
                  salesGrowth: 0,
                  averageOrderValue: 0,
                  totalOrdersProcessed: 0,
                  returnRate: 0,
                }
              : undefined,
          failedLoginAttempts: 0,
          isDeleted: false,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          createdBy: auth.currentUser?.uid || "system",
          updatedBy: auth.currentUser?.uid || "system",
          mustChangePassword: userData.mustChangePassword || false,
          notes: userData.notes,
          tags: userData.tags,
        };

        // Save to Firestore
        const userRef = doc(db, "users", firebaseUser.uid);
        await setDoc(userRef, userDoc);

        // Create auth user object
        const authUser = createAuthUser(firebaseUser, userDoc);

        // Update state
        setUser(authUser);
        setUserDocument(userDoc);

        return authUser;
      } catch (error: any) {
        console.error("Registration failed:", error);
        throw new Error(
          error.message || "Registration failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    },
    [createAuthUser]
  );

  // =============================================================================
  // PASSWORD MANAGEMENT
  // =============================================================================

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error("Password reset failed:", error);
      throw new Error(error.message || "Failed to send password reset email.");
    } finally {
      setLoading(false);
    }
  }, []);

  const changePassword = useCallback(
    async (data: ChangePasswordData): Promise<void> => {
      if (!auth.currentUser) {
        throw new Error("No authenticated user found.");
      }

      if (data.newPassword !== data.confirmPassword) {
        throw new Error("New passwords do not match.");
      }

      setLoading(true);
      try {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(
          auth.currentUser.email!,
          data.currentPassword
        );
        await reauthenticateWithCredential(auth.currentUser, credential);

        // Update password
        await updatePassword(auth.currentUser, data.newPassword);

        // Update user document
        if (userDocument) {
          const userRef = doc(db, "users", auth.currentUser.uid);
          await updateDoc(userRef, {
            passwordLastChanged: Timestamp.now(),
            mustChangePassword: false,
            updatedAt: Timestamp.now(),
          });
        }
      } catch (error: any) {
        console.error("Password change failed:", error);
        throw new Error(error.message || "Failed to change password.");
      } finally {
        setLoading(false);
      }
    },
    [userDocument]
  );

  // =============================================================================
  // USER PROFILE MANAGEMENT
  // =============================================================================

  const refreshUser = useCallback(async (): Promise<void> => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userDoc = userSnap.data() as UserDocument;
        const authUser = createAuthUser(auth.currentUser, userDoc);

        setUser(authUser);
        setUserDocument(userDoc);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  }, [createAuthUser]);

  const updateUserProfile = useCallback(
    async (updates: Partial<UserDocument>): Promise<void> => {
      if (!auth.currentUser || !userDocument) {
        throw new Error("No authenticated user found.");
      }

      setLoading(true);
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const updateData = {
          ...updates,
          updatedAt: Timestamp.now(),
          updatedBy: auth.currentUser.uid,
        };

        await updateDoc(userRef, updateData);
        await refreshUser();
      } catch (error: any) {
        console.error("Failed to update user profile:", error);
        throw new Error(error.message || "Failed to update profile.");
      } finally {
        setLoading(false);
      }
    },
    [userDocument, refreshUser]
  );

  // =============================================================================
  // PERMISSION CHECKS
  // =============================================================================

  const checkPermission = useCallback(
    (permission: string): boolean => {
      if (!userDocument) return false;
      return hasPermission(userDocument, permission);
    },
    [userDocument]
  );

  const checkAccess = useCallback(
    (
      resource: string,
      action: string,
      resourceData?: any
    ): PermissionCheckResult => {
      if (!userDocument) {
        return {
          hasPermission: false,
          reason: "User not authenticated",
        };
      }
      return canAccessResource(userDocument, resource, action, resourceData);
    },
    [userDocument]
  );

  const checkRole = useCallback(
    (role: UserRoleType | UserRoleType[]): boolean => {
      if (!userDocument) return false;

      if (Array.isArray(role)) {
        return role.includes(userDocument.role);
      }
      return userDocument.role === role;
    },
    [userDocument]
  );

  // =============================================================================
  // SESSION MANAGEMENT
  // =============================================================================

  const getSession = useCallback((): UserSession | null => {
    if (!user || !auth.currentUser) return null;

    return {
      user,
      accessToken: "", // Would be implemented with custom tokens
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
  }, [user]);

  const isAuthenticated = useCallback((): boolean => {
    return !!user && !!auth.currentUser;
  }, [user]);

  const isActive = useCallback((): boolean => {
    return !!user && user.isActive;
  }, [user]);

  // =============================================================================
  // AUTH STATE LISTENER
  // =============================================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setInitializing(true);

      if (firebaseUser) {
        try {
          // Get user document
          const userRef = doc(db, "users", firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userDoc = userSnap.data() as UserDocument;

            // Check if user is still active
            if (userDoc.isActive && !userDoc.isDeleted) {
              const authUser = createAuthUser(firebaseUser, userDoc);
              setUser(authUser);
              setUserDocument(userDoc);
            } else {
              // User is inactive or deleted, sign out
              await signOut(auth);
              setUser(null);
              setUserDocument(null);
            }
          } else {
            // User document doesn't exist, sign out
            await signOut(auth);
            setUser(null);
            setUserDocument(null);
          }
        } catch (error) {
          console.error("Error fetching user document:", error);
          setUser(null);
          setUserDocument(null);
        }
      } else {
        setUser(null);
        setUserDocument(null);
      }

      setInitializing(false);
    });

    return unsubscribe;
  }, [createAuthUser]);

  // =============================================================================
  // CONTEXT VALUE
  // =============================================================================

  const value: AuthContextType = {
    // State
    user,
    userDocument,
    loading,
    initializing,

    // Authentication
    login,
    logout,
    register,

    // Password management
    resetPassword,
    changePassword,

    // Profile management
    refreshUser,
    updateUserProfile,

    // Permission checks
    hasPermission: checkPermission,
    canAccess: checkAccess,
    isRole: checkRole,

    // Session management
    getSession,
    isAuthenticated,
    isActive,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// CUSTOM HOOK
// =============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// =============================================================================
// HIGHER ORDER COMPONENTS
// =============================================================================

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean;
    requireRoles?: UserRoleType[];
    requirePermissions?: string[];
    redirectTo?: string;
  }
) {
  return function AuthenticatedComponent(props: P) {
    const { user, userDocument, initializing } = useAuth();
    const {
      requireAuth = true,
      requireRoles = [],
      requirePermissions = [],
      redirectTo = "/login",
    } = options || {};

    // Show loading while initializing
    if (initializing) {
      return <div>Loading...</div>;
    }

    // Check authentication requirement
    if (requireAuth && !user) {
      if (typeof window !== "undefined") {
        window.location.href = redirectTo;
      }
      return null;
    }

    // Check role requirements
    if (requireRoles.length > 0 && userDocument) {
      if (!requireRoles.includes(userDocument.role)) {
        return <div>Access denied. Insufficient permissions.</div>;
      }
    }

    // Check permission requirements
    if (requirePermissions.length > 0 && userDocument) {
      const hasAllPermissions = requirePermissions.every((permission) =>
        hasPermission(userDocument, permission)
      );

      if (!hasAllPermissions) {
        return <div>Access denied. Insufficient permissions.</div>;
      }
    }

    return <Component {...props} />;
  };
}

// =============================================================================
// PERMISSION GUARD COMPONENT
// =============================================================================

interface PermissionGuardProps {
  children: React.ReactNode;
  permission?: string;
  role?: UserRoleType | UserRoleType[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
}

export function PermissionGuard({
  children,
  permission,
  role,
  fallback = null,
}: PermissionGuardProps) {
  const { hasPermission, isRole } = useAuth();

  // Check permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check role
  if (role && !isRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default AuthContext;
