/**
 * CampusSpace Frontend Module Entry Point
 * Re-exports primary UI components, stores, and layout primitives for judges & modular consumers.
 */

export { Navbar } from '../src/components/Navbar';
export { AppFooter } from '../src/components/AppFooter';
export { AuthGuard } from '../src/components/AuthGuard';
export { BubbleButton } from '../src/components/BubbleButton';
export { RoleSwitcher } from '../src/components/RoleSwitcher';
export { CampusMapSvg } from '../src/components/CampusMapSvg';
export { RoomDetailsModal } from '../src/components/RoomDetailsModal';
export { RejectModal } from '../src/components/RejectModal';
export { WorkflowTracker } from '../src/components/WorkflowTracker';
export { UserAccountMenu } from '../src/components/UserAccountMenu';
export { IdProofUpload } from '../src/components/IdProofUpload';
export { DemoBanner } from '../src/components/DemoBanner';
export { ConcurrencySimulator } from '../src/components/ConcurrencySimulator';
export { useCampusStore, CampusProvider } from '../src/lib/store';
