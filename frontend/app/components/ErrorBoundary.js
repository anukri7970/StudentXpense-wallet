'use client';

import { Component } from 'react';
import Button from './ui/Button';
import Panel from './ui/Panel';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.captureException(error, { extra: info });
      });
    }
    // eslint-disable-next-line no-console
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[40vh] flex items-center justify-center p-6">
          <Panel className="p-8 max-w-md text-center">
            <p className="font-display text-xl text-parchment mb-2">
              Something didn&apos;t load right.
            </p>
            <p className="text-sm text-slate-muted mb-5">
              The error&apos;s been logged. Try reloading this section.
            </p>
            <Button onClick={() => this.setState({ hasError: false })}>Try again</Button>
          </Panel>
        </div>
      );
    }
    return this.props.children;
  }
}
