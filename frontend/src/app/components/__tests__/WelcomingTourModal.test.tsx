import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WelcomingTourModal } from '../WelcomingTourModal';
import '@testing-library/jest-dom';

describe('WelcomingTourModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  describe('Rendering', () => {
    it('should not render when show is false', () => {
      render(<WelcomingTourModal show={false} onClose={mockOnClose} />);
      expect(screen.queryByText('LLM Provider Guide')).not.toBeInTheDocument();
    });

    it('should render when show is true', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      expect(screen.getByText('LLM Provider Guide')).toBeInTheDocument();
    });

    it('should render all 6 tabs', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('What are LLM Providers?')).toBeInTheDocument();
      expect(screen.getByText('Local Models')).toBeInTheDocument();
      expect(screen.getByText('Google Gemini')).toBeInTheDocument();
      expect(screen.getByText('OpenRouter')).toBeInTheDocument();
      expect(screen.getByText('Configuration Guide')).toBeInTheDocument();
      expect(screen.getByText('Testing & Troubleshooting')).toBeInTheDocument();
    });

    it('should display progress indicator', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      expect(screen.getByText('1 of 6')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to next tab when clicking Next button', async () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('2 of 6')).toBeInTheDocument();
      });
    });

    it('should navigate to previous tab when clicking Previous button', async () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      // Go to second tab first
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('2 of 6')).toBeInTheDocument();
      });
      
      // Then go back
      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);
      
      await waitFor(() => {
        expect(screen.getByText('1 of 6')).toBeInTheDocument();
      });
    });

    it('should disable Previous button on first tab', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });

    it('should show "Got it, thanks!" button on last tab', async () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      // Navigate to last tab
      const nextButton = screen.getByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextButton);
      }
      
      await waitFor(() => {
        expect(screen.getByText('Got it, thanks!')).toBeInTheDocument();
        expect(screen.queryByText('Next')).not.toBeInTheDocument();
      });
    });

    it('should navigate by clicking on tab buttons', async () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const geminiTab = screen.getByRole('tab', { name: /Google Gemini/i });
      fireEvent.click(geminiTab);
      
      await waitFor(() => {
        expect(screen.getByText('3 of 6')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal on Escape key press', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'tour-modal-title');
    });

    it('should have close button with aria-label', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should mark active tab with aria-selected', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Close Functionality', () => {
    it('should call onClose when clicking close button', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const closeButton = screen.getByLabelText('Close modal');
      fireEvent.click(closeButton);
      
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking "Got it, thanks!" on last tab', async () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      // Navigate to last tab
      const nextButton = screen.getByText('Next');
      for (let i = 0; i < 5; i++) {
        fireEvent.click(nextButton);
      }
      
      await waitFor(() => {
        const gotItButton = screen.getByText('Got it, thanks!');
        fireEvent.click(gotItButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should call onClose when clicking backdrop', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const backdrop = screen.getByRole('dialog').parentElement;
      if (backdrop) {
        fireEvent.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should reset to first tab when modal closes', async () => {
      const { rerender } = render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      // Navigate to second tab
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('2 of 6')).toBeInTheDocument();
      });
      
      // Close modal
      rerender(<WelcomingTourModal show={false} onClose={mockOnClose} />);
      
      // Reopen modal
      rerender(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      // Should be back to first tab
      expect(screen.getByText('1 of 6')).toBeInTheDocument();
    });
  });

  describe('Content', () => {
    it('should display Introduction tab content', () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      expect(screen.getByText('What is an LLM Provider?')).toBeInTheDocument();
      expect(screen.getByText(/An LLM (Large Language Model) Provider/)).toBeInTheDocument();
    });

    it('should display Local Models tab content when navigated', async () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const localTab = screen.getByRole('tab', { name: /Local Models/i });
      fireEvent.click(localTab);
      
      await waitFor(() => {
        expect(screen.getByText('Private & Self-hosted (Default)')).toBeInTheDocument();
        expect(screen.getByText(/TinyLlama-1.1B Chat Model/)).toBeInTheDocument();
      });
    });

    it('should display links to configuration pages', async () => {
      render(<WelcomingTourModal show={true} onClose={mockOnClose} />);
      
      const configTab = screen.getByRole('tab', { name: /Configuration Guide/i });
      fireEvent.click(configTab);
      
      await waitFor(() => {
        const playgroundLinks = screen.getAllByRole('link', { name: /playground/i });
        expect(playgroundLinks.length).toBeGreaterThan(0);
      });
    });
  });
});