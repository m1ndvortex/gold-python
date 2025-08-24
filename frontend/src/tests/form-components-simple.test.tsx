import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { Input } from '../components/ui/input'
import { Checkbox } from '../components/ui/checkbox'
import { Switch } from '../components/ui/switch'
import { Textarea } from '../components/ui/textarea'

describe('Form Components Basic Tests', () => {
  test('Input renders with gradient variant', () => {
    render(<Input variant="gradient-green" placeholder="Test input" />)
    const input = screen.getByPlaceholderText('Test input')
    expect(input).toBeInTheDocument()
  })

  test('Checkbox renders with gradient variant', () => {
    render(<Checkbox variant="gradient-blue" />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeInTheDocument()
  })

  test('Switch renders with gradient variant', () => {
    render(<Switch variant="gradient-purple" />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeInTheDocument()
  })

  test('Textarea renders with gradient variant', () => {
    render(<Textarea variant="gradient-pink" placeholder="Test textarea" />)
    const textarea = screen.getByPlaceholderText('Test textarea')
    expect(textarea).toBeInTheDocument()
  })
})