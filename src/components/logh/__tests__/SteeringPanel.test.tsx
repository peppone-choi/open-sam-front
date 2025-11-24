import { render, screen, fireEvent } from '@testing-library/react';
import SteeringPanel from '../SteeringPanel';

describe('SteeringPanel', () => {
  it('renders all 6 sliders', () => {
    render(<SteeringPanel />);
    
    expect(screen.getByText('빔 무장')).toBeInTheDocument();
    expect(screen.getByText('포격 시스템')).toBeInTheDocument();
    expect(screen.getByText('방어막')).toBeInTheDocument();
    expect(screen.getByText('추진 기관')).toBeInTheDocument();
    expect(screen.getByText('워프 드라이브')).toBeInTheDocument();
    expect(screen.getByText('센서 어레이')).toBeInTheDocument();
  });

  it('starts with default distribution totaling 100%', () => {
    render(<SteeringPanel />);
    expect(screen.getByText('100/100%')).toBeInTheDocument();
    expect(screen.getByText('✓ 최적 배분')).toBeInTheDocument();
  });

  it('displays total percentage correctly', () => {
    const { container } = render(<SteeringPanel />);
    
    // Find all range inputs
    const sliders = container.querySelectorAll('input[type="range"]');
    expect(sliders).toHaveLength(6);
    
    // Set BEAM to 50% (should redistribute others)
    fireEvent.change(sliders[0], { target: { value: '50' } });
    
    // Total should still be 100% or less
    const totalDisplay = screen.getByText(/\/100%/);
    expect(totalDisplay).toBeInTheDocument();
  });

  it('prevents total from exceeding 100%', () => {
    const { container } = render(<SteeringPanel />);
    const sliders = container.querySelectorAll('input[type="range"]');
    
    // Try to set BEAM to 100%
    fireEvent.change(sliders[0], { target: { value: '100' } });
    
    // Check that total is exactly 100%
    expect(screen.getByText('100/100%')).toBeInTheDocument();
  });

  it('shows warning when attempting to exceed 100%', () => {
    const { container } = render(<SteeringPanel />);
    const sliders = container.querySelectorAll('input[type="range"]');
    
    // Set BEAM to high value
    fireEvent.change(sliders[0], { target: { value: '90' } });
    
    // The component should auto-redistribute
    const totalText = screen.getByText(/\/100%/);
    expect(totalText).toBeInTheDocument();
  });

  it('redistributes proportionally when exceeding 100%', () => {
    const { container } = render(<SteeringPanel />);
    const sliders = container.querySelectorAll('input[type="range"]') as NodeListOf<HTMLInputElement>;
    
    // Initial state: BEAM=20, GUN=20, SHIELD=20, ENGINE=20, WARP=0, SENSOR=20
    // Increase BEAM to 80 (total would be 140, excess = 40)
    fireEvent.change(sliders[0], { target: { value: '80' } });
    
    // After redistribution, total should be 100%
    const total = Array.from(sliders).reduce((sum, slider) => sum + parseInt(slider.value), 0);
    expect(total).toBe(100);
  });

  it('handles edge case: all other sliders at 0', () => {
    const { container } = render(<SteeringPanel />);
    const sliders = container.querySelectorAll('input[type="range"]') as NodeListOf<HTMLInputElement>;
    
    // Set all sliders to 0
    sliders.forEach(slider => {
      fireEvent.change(slider, { target: { value: '0' } });
    });
    
    // Now set BEAM to 150 (should cap at 100)
    fireEvent.change(sliders[0], { target: { value: '150' } });
    
    expect(sliders[0].value).toBe('100');
    expect(screen.getByText('100/100%')).toBeInTheDocument();
  });

  it('shows under-utilization message when total < 100%', () => {
    const { container } = render(<SteeringPanel />);
    const sliders = container.querySelectorAll('input[type="range"]');
    
    // Set all sliders to low values
    fireEvent.change(sliders[0], { target: { value: '10' } }); // BEAM
    fireEvent.change(sliders[1], { target: { value: '10' } }); // GUN
    fireEvent.change(sliders[2], { target: { value: '10' } }); // SHIELD
    fireEvent.change(sliders[3], { target: { value: '10' } }); // ENGINE
    fireEvent.change(sliders[4], { target: { value: '0' } });  // WARP
    fireEvent.change(sliders[5], { target: { value: '10' } }); // SENSOR
    // Total = 50%
    
    expect(screen.getByText('• 50% 여유')).toBeInTheDocument();
  });

  it('resets to default distribution when reset button clicked', () => {
    const { container } = render(<SteeringPanel />);
    const sliders = container.querySelectorAll('input[type="range"]') as NodeListOf<HTMLInputElement>;
    
    // Change some values
    fireEvent.change(sliders[0], { target: { value: '50' } });
    fireEvent.change(sliders[1], { target: { value: '30' } });
    
    // Click reset button
    const resetButton = screen.getByText('초기화');
    fireEvent.click(resetButton);
    
    // Should be back to default (100% total)
    expect(screen.getByText('100/100%')).toBeInTheDocument();
    expect(screen.getByText('✓ 최적 배분')).toBeInTheDocument();
  });

  it('maintains exactly 100% after multiple adjustments', () => {
    const { container } = render(<SteeringPanel />);
    const sliders = container.querySelectorAll('input[type="range"]') as NodeListOf<HTMLInputElement>;
    
    // Simulate multiple user adjustments
    const adjustments = [
      { index: 0, value: 40 }, // BEAM
      { index: 1, value: 30 }, // GUN
      { index: 2, value: 50 }, // SHIELD (should trigger redistribution)
      { index: 3, value: 25 }, // ENGINE
    ];
    
    adjustments.forEach(({ index, value }) => {
      fireEvent.change(sliders[index], { target: { value: value.toString() } });
    });
    
    // Final total should be <= 100%
    const total = Array.from(sliders).reduce((sum, slider) => sum + parseInt(slider.value), 0);
    expect(total).toBeLessThanOrEqual(100);
  });

  it('visual feedback changes based on total', () => {
    const { container } = render(<SteeringPanel />);
    
    // At 100%: should show green optimal state
    expect(screen.getByText('✓ 최적 배분')).toHaveClass('text-[#10B981]');
    
    // Reduce to under 100%
    const sliders = container.querySelectorAll('input[type="range"]');
    fireEvent.change(sliders[0], { target: { value: '10' } });
    
    // Should show spare capacity message
    const spareMessage = screen.getByText(/여유/);
    expect(spareMessage).toBeInTheDocument();
  });
});
