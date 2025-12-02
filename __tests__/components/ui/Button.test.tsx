/**
 * Button UI 컴포넌트 테스트
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, buttonVariants } from '@/components/ui/button';

describe('Button 컴포넌트', () => {
  // ============================================================================
  // 기본 렌더링 테스트
  // ============================================================================

  describe('기본 렌더링', () => {
    it('기본 버튼이 렌더링되어야 함', () => {
      render(<Button>Click me</Button>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('children이 올바르게 표시되어야 함', () => {
      render(<Button>테스트 버튼</Button>);
      
      expect(screen.getByText('테스트 버튼')).toBeInTheDocument();
    });

    it('버튼이 type 속성 없이 렌더링되어야 함', () => {
      render(<Button>버튼</Button>);
      
      const button = screen.getByRole('button');
      // HTML button의 기본 type은 'submit'이지만, 명시적 설정 없음
      expect(button.tagName).toBe('BUTTON');
    });
  });

  // ============================================================================
  // variant 테스트
  // ============================================================================

  describe('variant 속성', () => {
    it('primary variant가 적용되어야 함', () => {
      render(<Button variant="primary">Primary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600');
    });

    it('secondary variant가 적용되어야 함', () => {
      render(<Button variant="secondary">Secondary</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-white/5');
    });

    it('destructive variant가 적용되어야 함', () => {
      render(<Button variant="destructive">Destructive</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('outline variant가 적용되어야 함', () => {
      render(<Button variant="outline">Outline</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('ghost variant가 적용되어야 함', () => {
      render(<Button variant="ghost">Ghost</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-accent');
    });

    it('link variant가 적용되어야 함', () => {
      render(<Button variant="link">Link</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  // ============================================================================
  // size 테스트
  // ============================================================================

  describe('size 속성', () => {
    it('default size가 적용되어야 함', () => {
      render(<Button size="default">Default</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'px-4', 'py-2');
    });

    it('sm size가 적용되어야 함', () => {
      render(<Button size="sm">Small</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-9', 'px-3');
    });

    it('lg size가 적용되어야 함', () => {
      render(<Button size="lg">Large</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-11', 'px-8');
    });

    it('icon size가 적용되어야 함', () => {
      render(<Button size="icon">🔍</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  // ============================================================================
  // 이벤트 핸들링 테스트
  // ============================================================================

  describe('이벤트 핸들링', () => {
    it('클릭 이벤트가 발생해야 함', () => {
      const handleClick = jest.fn();
      render(<Button onClick={handleClick}>Click</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('disabled 상태에서 클릭이 작동하지 않아야 함', () => {
      const handleClick = jest.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // disabled 상태 테스트
  // ============================================================================

  describe('disabled 상태', () => {
    it('disabled 속성이 적용되어야 함', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('disabled 상태에서 올바른 스타일이 적용되어야 함', () => {
      render(<Button disabled>Disabled</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
    });
  });

  // ============================================================================
  // 커스텀 className 테스트
  // ============================================================================

  describe('커스텀 className', () => {
    it('커스텀 className이 병합되어야 함', () => {
      render(<Button className="custom-class">Custom</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('기본 클래스와 커스텀 클래스가 모두 적용되어야 함', () => {
      render(<Button variant="primary" className="my-custom">Both</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600', 'my-custom');
    });
  });

  // ============================================================================
  // ref 전달 테스트
  // ============================================================================

  describe('ref 전달', () => {
    it('ref가 올바르게 전달되어야 함', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Ref Button</Button>);
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current?.textContent).toBe('Ref Button');
    });
  });

  // ============================================================================
  // HTML 속성 전달 테스트
  // ============================================================================

  describe('HTML 속성 전달', () => {
    it('type 속성이 전달되어야 함', () => {
      render(<Button type="submit">Submit</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('aria-label이 전달되어야 함', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      
      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });

    it('data 속성이 전달되어야 함', () => {
      render(<Button data-testid="custom-button">Test</Button>);
      
      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
    });

    it('id 속성이 전달되어야 함', () => {
      render(<Button id="my-button">ID Button</Button>);
      
      const button = document.getElementById('my-button');
      expect(button).toBeInTheDocument();
    });
  });

  // ============================================================================
  // buttonVariants 함수 테스트
  // ============================================================================

  describe('buttonVariants 함수', () => {
    it('기본 variant와 size가 적용되어야 함', () => {
      const classes = buttonVariants();
      
      expect(classes).toContain('bg-blue-600'); // primary variant
      expect(classes).toContain('h-10'); // default size
    });

    it('커스텀 variant가 적용되어야 함', () => {
      const classes = buttonVariants({ variant: 'destructive' });
      
      expect(classes).toContain('bg-red-500');
    });

    it('커스텀 size가 적용되어야 함', () => {
      const classes = buttonVariants({ size: 'lg' });
      
      expect(classes).toContain('h-11');
      expect(classes).toContain('px-8');
    });

    it('추가 className이 병합되어야 함', () => {
      const classes = buttonVariants({ className: 'extra-class' });
      
      expect(classes).toContain('extra-class');
    });
  });

  // ============================================================================
  // 접근성 테스트
  // ============================================================================

  describe('접근성', () => {
    it('포커스 가능해야 함', () => {
      render(<Button>Focusable</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      
      expect(document.activeElement).toBe(button);
    });

    it('focus-visible 스타일이 적용되어야 함', () => {
      render(<Button>Focus</Button>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2');
    });

    it('disabled 상태에서 포커스가 불가능해야 함', () => {
      render(
        <>
          <Button>First</Button>
          <Button disabled>Disabled</Button>
          <Button>Third</Button>
        </>
      );
      
      const disabledButton = screen.getByRole('button', { name: /disabled/i });
      disabledButton.focus();
      
      // disabled 버튼은 포커스를 받지 않음
      expect(document.activeElement).not.toBe(disabledButton);
    });
  });

  // ============================================================================
  // displayName 테스트
  // ============================================================================

  describe('displayName', () => {
    it('displayName이 설정되어 있어야 함', () => {
      expect(Button.displayName).toBe('Button');
    });
  });
});

