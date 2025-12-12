import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ProjectTypeSelector,
  projectTypeOptions,
} from '../project-type-selector'

describe('ProjectTypeSelector', () => {
  const mockOnTypeSelect = vi.fn()

  beforeEach(() => {
    mockOnTypeSelect.mockClear()
  })

  it('renders all project type options', () => {
    render(<ProjectTypeSelector onTypeSelect={mockOnTypeSelect} />)

    // Check that all project type options are rendered
    expect(screen.getByText('Loan Tracker')).toBeInTheDocument()
    expect(screen.getByText('Expense Splitting')).toBeInTheDocument()
    expect(screen.getByText('General Project')).toBeInTheDocument()

    // Check descriptions are rendered
    expect(
      screen.getByText(/Track money you've lent or borrowed/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Split bills and expenses fairly/),
    ).toBeInTheDocument()
    expect(
      screen.getByText(/A flexible project for any financial tracking/),
    ).toBeInTheDocument()
  })

  it('calls onTypeSelect when an option is clicked', () => {
    render(<ProjectTypeSelector onTypeSelect={mockOnTypeSelect} />)

    const loanOption = screen.getByText('Loan Tracker').closest('button')
    fireEvent.click(loanOption!)

    expect(mockOnTypeSelect).toHaveBeenCalledWith('loan')
  })

  it('highlights the selected type', () => {
    render(
      <ProjectTypeSelector
        selectedType="splitwise"
        onTypeSelect={mockOnTypeSelect}
      />,
    )

    const splitwiseOption = screen
      .getByText('Expense Splitting')
      .closest('button')
    expect(splitwiseOption).toHaveClass('border-indigo-500')
    expect(splitwiseOption).toHaveClass('bg-indigo-50')
  })

  it('does not highlight unselected types', () => {
    render(
      <ProjectTypeSelector
        selectedType="splitwise"
        onTypeSelect={mockOnTypeSelect}
      />,
    )

    const loanOption = screen.getByText('Loan Tracker').closest('button')
    expect(loanOption).toHaveClass('border-zinc-200')
    expect(loanOption).not.toHaveClass('border-indigo-500')
  })

  it('applies custom className', () => {
    const { container } = render(
      <ProjectTypeSelector
        className="custom-class"
        onTypeSelect={mockOnTypeSelect}
      />,
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('handles all project type selections correctly', () => {
    render(<ProjectTypeSelector onTypeSelect={mockOnTypeSelect} />)

    // Test loan selection
    fireEvent.click(screen.getByText('Loan Tracker').closest('button')!)
    expect(mockOnTypeSelect).toHaveBeenCalledWith('loan')

    // Test splitwise selection
    fireEvent.click(screen.getByText('Expense Splitting').closest('button')!)
    expect(mockOnTypeSelect).toHaveBeenCalledWith('splitwise')

    // Test general selection
    fireEvent.click(screen.getByText('General Project').closest('button')!)
    expect(mockOnTypeSelect).toHaveBeenCalledWith('general')

    expect(mockOnTypeSelect).toHaveBeenCalledTimes(3)
  })

  it('exports project type options for external use', () => {
    expect(projectTypeOptions).toHaveLength(3)
    expect(projectTypeOptions[0]).toEqual({
      type: 'loan',
      name: 'Loan Tracker',
      description:
        "Track money you've lent or borrowed with friends and family",
      icon: expect.any(Object),
    })
    expect(projectTypeOptions[1]).toEqual({
      type: 'splitwise',
      name: 'Expense Splitting',
      description: 'Split bills and expenses fairly among group members',
      icon: expect.any(Object),
    })
    expect(projectTypeOptions[2]).toEqual({
      type: 'general',
      name: 'General Project',
      description: 'A flexible project for any financial tracking needs',
      icon: expect.any(Object),
    })
  })
})
