// SPDX-License-Identifier: Apache-2.0
import { Component, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppButton, EmptyState, Screen } from '@core/design';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen testID="screen-error">
      <EmptyState
        icon="alert-circle-outline"
        title={t('errors.screenTitle')}
        message={t('errors.screenMessage')}
      />
      <AppButton label={t('errors.retry')} onPress={onRetry} mode="contained-tonal" />
    </Screen>
  );
}

/** Contains a render error to one screen so the rest of the app keeps working. */
export class ScreenErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Screen crashed', error, info.componentStack);
  }

  private readonly reset = () => {
    this.setState({ hasError: false });
  };

  override render() {
    return this.state.hasError ? <ErrorFallback onRetry={this.reset} /> : this.props.children;
  }
}

/** Wraps a screen component in its own {@link ScreenErrorBoundary}. */
export function withScreenBoundary<P extends object>(ScreenComponent: ComponentType<P>) {
  function Bounded(props: P) {
    return (
      <ScreenErrorBoundary>
        <ScreenComponent {...props} />
      </ScreenErrorBoundary>
    );
  }
  Bounded.displayName = `withScreenBoundary(${ScreenComponent.displayName ?? ScreenComponent.name})`;
  return Bounded;
}
