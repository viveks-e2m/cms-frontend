import React from 'react';
import { render, screen } from '@testing-library/react';
import MarkdownSummary from './MarkdownSummary';

// Sample markdown content similar to what we get from Fathom
const sampleMarkdown = `## Meeting Purpose

Discuss AI implementation strategy and onboarding process for Spotted Fox Digital's partnership with E2M Solutions

## Key Takeaways

  - E2M will conduct a 4-5 week agency audit, followed by implementation of AI automations
  - Weekly calls (Mondays 9am PT/12pm ET) will be scheduled for the first month
  - Brad has extensive AI experience; focus will be on organizing/scaling existing efforts
  - Initial priorities: AI voice agent for calls, sharing copywriting agent with team

## Topics

### E2M's AI Implementation Process

  - Month 1: Agency audit with weekly stakeholder calls
  - Months 2-4: Implementation of prioritized AI automations
  - Audit of top 3 client accounts in months 3-4
  - Creation of agency blueprint by end of month 2/3

### Priority AI Projects

  - AI voice agent for answering calls (goal to test by November)
  - Sharing existing copywriting AI agent with team members
  - Automating tasks for assistant going on maternity leave in January

## Next Steps

  - E2M to send intro email with AI adoption specialist and account manager
  - Schedule first assessment call for Monday 9am PT/12pm ET
  - Brad to complete and return task audit Excel file`;

describe('MarkdownSummary', () => {
  test('renders markdown content correctly', () => {
    render(<MarkdownSummary summary={sampleMarkdown} />);
    
    // Check that headers are rendered
    expect(screen.getByText('Meeting Purpose')).toBeInTheDocument();
    expect(screen.getByText('Key Takeaways')).toBeInTheDocument();
    expect(screen.getByText('Topics')).toBeInTheDocument();
    expect(screen.getByText('Next Steps')).toBeInTheDocument();
    
    // Check that list items are rendered
    expect(screen.getByText(/E2M will conduct a 4-5 week agency audit/)).toBeInTheDocument();
    expect(screen.getByText(/Weekly calls \(Mondays 9am PT\/12pm ET\)/)).toBeInTheDocument();
  });

  test('renders empty state when no summary provided', () => {
    render(<MarkdownSummary summary="" />);
    
    expect(screen.getByText('No summary available for this meeting.')).toBeInTheDocument();
  });

  test('renders custom title', () => {
    render(<MarkdownSummary summary={sampleMarkdown} title="Custom Summary Title" />);
    
    expect(screen.getByText('Custom Summary Title')).toBeInTheDocument();
  });
});

export default MarkdownSummary;