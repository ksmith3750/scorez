import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// The component module transitively imports server actions, which pull in
// Next's server-only runtime. Stub that boundary so the component tree loads
// in jsdom — the tests drive the form action directly, not these.
jest.mock('@/app/actions', () => ({
  submitRound: jest.fn(),
  addPlayer: jest.fn(),
}))

import { SubmitButton } from '@/components/new-round-form'

test('disables the submit button while the round is being submitted', async () => {
  // An action that stays pending until we resolve it, so we can observe the
  // pending window where a second click could otherwise resubmit the round.
  let resolveAction: () => void
  const action = jest.fn(
    () => new Promise<void>(resolve => { resolveAction = resolve })
  )

  render(
    <form action={action}>
      <SubmitButton disabled={false} />
    </form>
  )

  const button = screen.getByRole('button', { name: 'Save Round' })
  expect(button).toBeEnabled()

  fireEvent.click(button)

  // While the action is in flight the button must be disabled, which is what
  // prevents a double-click from creating the round twice.
  await waitFor(() => expect(button).toBeDisabled())

  // Let the action finish and the pending state settle back.
  resolveAction!()
  await waitFor(() => expect(button).toBeEnabled())
})

test('stays disabled when the disabled prop is set, regardless of pending', () => {
  render(
    <form action={jest.fn()}>
      <SubmitButton disabled={true} />
    </form>
  )

  expect(screen.getByRole('button', { name: 'Save Round' })).toBeDisabled()
})
