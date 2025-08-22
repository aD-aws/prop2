# Authentication and User Management System

This document describes the implementation of the authentication and user management system for the UK Home Improvement Platform.

## Overview

The authentication system is built using AWS Cognito and provides:

- User registration and login for homeowners and builders
- Role-based access control (RBAC)
- User profile management
- Builder invitation code system
- Secure session management

## Components Implemented

### 1. Authentication Provider (`AuthProvider.tsx`)

The main authentication context that manages user state and provides authentication methods:

- `signIn(email, password)` - User login
- `signUp(params)` - User registration with role-specific fields
- `confirmSignUp(email, code)` - Email verification
- `signOut()` - User logout
- `refreshUser()` - Refresh user data

### 2. Protected Routes (`ProtectedRoute.tsx`)

Provides route protection and role-based access control:

- `ProtectedRoute` component for wrapping protected pages
- `withAuth` HOC for component-level protection
- `usePermissions` hook for checking user roles

### 3. Authentication Forms

#### Login Form (`LoginForm.tsx`)
- Email/password authentication
- Error handling and validation
- Redirect to dashboard on success

#### Registration Form (`RegisterForm.tsx`)
- Role-based registration (homeowner/builder)
- Builder-specific fields (company name, Companies House number)
- Invitation code support for builders
- Email confirmation flow

### 4. User Profile Management (`UserProfile.tsx`)

- View and edit user profile information
- Role-specific fields for builders
- Real-time updates to Cognito user attributes

### 5. Builder Invitation System (`InvitationManager.tsx`)

Comprehensive invitation system for homeowners to invite builders:

- Generate one-time invitation codes
- Multiple sharing methods (QR code, email, WhatsApp)
- Code expiration and validation
- Project-specific invitations

## AWS Infrastructure

### Cognito Configuration

The system uses AWS Cognito with:

- User Pool for authentication
- Custom attributes for user types and builder information
- Identity Pool for AWS resource access
- Email verification enabled

### DynamoDB Tables

- **Users Table**: User profile data
- **Invitations Table**: Builder invitation codes and tracking
- **Projects Table**: Project data linked to users
- **Builders Table**: Builder-specific information and vetting status

## Role-Based Access Control

### User Types

1. **Homeowner**
   - Can create projects
   - Can invite builders
   - Can view and compare quotes

2. **Builder**
   - Requires invitation code to register
   - Must provide company information
   - Goes through vetting process
   - Can access projects and submit quotes

3. **Admin**
   - Can manage all users
   - Can access platform analytics
   - Can manage builder vetting

### Permission Checking

Use the `usePermissions` hook to check user roles:

```typescript
const { isHomeowner, isBuilder, isAdmin } = usePermissions();

if (isHomeowner()) {
  // Homeowner-specific functionality
}
```

## Security Features

1. **Password Policy**: Enforced through Cognito (8+ chars, mixed case, numbers, symbols)
2. **Email Verification**: Required for all new accounts
3. **Session Management**: JWT tokens with automatic refresh
4. **Role Validation**: Server-side role checking for all protected operations
5. **Invitation Codes**: One-time use codes with expiration

## Environment Configuration

Required environment variables:

```env
NEXT_PUBLIC_AWS_REGION=eu-west-2
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-user-pool-id
NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID=your-user-pool-client-id
NEXT_PUBLIC_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Usage Examples

### Protecting a Page

```typescript
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MyPage() {
  return (
    <ProtectedRoute allowedRoles={['homeowner']}>
      <MyPageContent />
    </ProtectedRoute>
  );
}
```

### Using Authentication Context

```typescript
import { useAuth } from '@/components/auth/AuthProvider';

function MyComponent() {
  const { user, isAuthenticated, signOut } = useAuth();
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>;
  }
  
  return (
    <div>
      Welcome, {user.profile.firstName}!
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Generating Builder Invitations

```typescript
import { InvitationManager } from '@/components/invitations/InvitationManager';

function ProjectPage() {
  return (
    <InvitationManager
      projectId="project-123"
      homeownerId="user-456"
      projectType="kitchen_renovation"
      homeownerName="John Smith"
    />
  );
}
```

## Testing

The system includes comprehensive error handling and validation:

- Form validation with user-friendly error messages
- Network error handling with retry mechanisms
- Invalid invitation code detection
- Session expiration handling

## Next Steps

The authentication system is ready for:

1. Integration with the project management system
2. Builder vetting workflow implementation
3. Payment processing integration
4. Advanced analytics and reporting

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **2.1**: User registration and login with AWS Cognito integration ✅
- **2.4**: Builder invitation code requirement ✅
- **2.5**: Builder credentials collection (Companies House, etc.) ✅
- **2.6**: Builder vetting process foundation ✅
- **2.7**: One-time invitation codes with project association ✅
- **2.8**: Ongoing project access for builders after initial invitation ✅

The system provides a solid foundation for the complete UK Home Improvement Platform with secure, scalable authentication and user management.