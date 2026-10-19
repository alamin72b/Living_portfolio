// @vitest-environment jsdom
import React from 'react';
import { beforeAll, afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { ReactFlowProvider } from '@xyflow/react';
import { emptyWorkspace, sampleWorkspace } from '@blueprint/shared';
import { IndexPanel } from './IndexPanel';
import { DetailPanel } from './DetailPanel';
import { PieceNode } from './PieceNode';
import { arrangedPositions } from '../graph';
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  window.matchMedia = vi
    .fn()
    .mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() });
});
afterEach(cleanup);
describe('Accessible content experience', () => {
  it('gives an honest empty index', () => {
    render(<IndexPanel data={emptyWorkspace} onClose={() => {}} onSelect={() => {}} />);
    expect(screen.getByText('The first piece is still to come.')).toBeInTheDocument();
  });
  it('searches by title and filters by kind', () => {
    render(<IndexPanel data={sampleWorkspace} onClose={() => {}} onSelect={() => {}} />);
    fireEvent.change(screen.getByLabelText('Search creations'), {
      target: { value: 'working component' },
    });
    expect(screen.getByText('A working component')).toBeInTheDocument();
    expect(screen.queryByText('A small interaction')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'project' }));
    expect(screen.getByText('Nothing matches yet.')).toBeInTheDocument();
  });
  it('opens a creation directly without spatial navigation', () => {
    const select = vi.fn();
    render(<IndexPanel data={sampleWorkspace} onClose={() => {}} onSelect={select} />);
    fireEvent.click(screen.getByRole('button', { name: /A working component/ }));
    expect(select).toHaveBeenCalledWith(sampleWorkspace.pieces[2].id);
  });
  it('shows neutral attribution and constituent pieces', () => {
    render(
      <DetailPanel
        piece={sampleWorkspace.pieces[3]}
        data={sampleWorkspace}
        onClose={() => {}}
        onSelect={() => {}}
        onExpand={() => {}}
        expanded={false}
      />,
    );
    expect(
      screen.getByText('Illustrative example. This is not an achievement of the owner.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A working component' })).toBeInTheDocument();
  });
  it('opens an exploded view from the detail panel', () => {
    const expand = vi.fn();
    render(
      <DetailPanel
        piece={sampleWorkspace.pieces[3]}
        data={sampleWorkspace}
        onClose={() => {}}
        onSelect={() => {}}
        onExpand={expand}
        expanded={false}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reveal the constituent pieces' }));
    expect(expand).toHaveBeenCalledOnce();
  });
  it('expands and reassembles without mutating persisted positions or identities', () => {
    const before = structuredClone(sampleWorkspace);
    const exploded = arrangedPositions(sampleWorkspace, sampleWorkspace.pieces[3].id);
    expect(exploded.get(sampleWorkspace.pieces[0].id)).not.toEqual(before.pieces[0].position);
    expect(arrangedPositions(sampleWorkspace, null).get(before.pieces[0].id)).toEqual(
      before.pieces[0].position,
    );
    expect(sampleWorkspace).toEqual(before);
  });
  it('renders blueprint and realized state with real stage labels', () => {
    const piece = sampleWorkspace.pieces[0];
    const props = {
      id: piece.id,
      data: {
        piece,
        onOpen: vi.fn(),
        onExpand: vi.fn(),
        expanded: false,
        componentCount: 0,
        highlight: false,
      },
      type: 'piece' as const,
      dragging: false,
      selected: false,
      isConnectable: false,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
      zIndex: 0,
      draggable: false,
      selectable: true,
      deletable: false,
    };
    const { container, rerender } = render(
      <ReactFlowProvider>
        <PieceNode {...props} />
      </ReactFlowProvider>,
    );
    expect(container.querySelector('[data-stage="blueprint"]')).toBeInTheDocument();
    rerender(
      <ReactFlowProvider>
        <PieceNode {...props} data={{ ...props.data, piece: { ...piece, stage: 'working' } }} />
      </ReactFlowProvider>,
    );
    expect(container.querySelector('[data-stage="working"]')).toBeInTheDocument();
  });
  it('renders English goals as blueprints and accomplishments as realized objects', () => {
    const goal = {
      ...sampleWorkspace.pieces[0],
      title: 'Complete an English course',
      summary: 'Goal: Complete an English course.',
      area: 'english_communication' as const,
      stage: 'blueprint' as const,
      milestone: {
        state: 'goal' as const,
        intention: 'Complete an English course',
        description: '',
        target: 'Finish the course.',
        targetDate: '',
      },
      evidence: [],
    };
    const props = {
      id: goal.id,
      data: {
        piece: goal,
        onOpen: vi.fn(),
        onExpand: vi.fn(),
        expanded: false,
        componentCount: 0,
        highlight: false,
      },
      type: 'piece' as const,
      dragging: false,
      selected: false,
      isConnectable: false,
      positionAbsoluteX: 0,
      positionAbsoluteY: 0,
      zIndex: 0,
      draggable: false,
      selectable: true,
      deletable: false,
    };
    const { container, rerender } = render(
      <ReactFlowProvider>
        <PieceNode {...props} />
      </ReactFlowProvider>,
    );
    expect(screen.getByText('GOAL / BLUEPRINT')).toBeInTheDocument();
    expect(container.querySelector('[data-milestone="goal"]')).toBeInTheDocument();
    const accomplishment = {
      ...goal,
      title: 'Completed an English course',
      stage: 'working' as const,
      milestone: {
        state: 'accomplishment' as const,
        achievement: 'Completed the English course.',
        description: '',
        result: 'Completed the final assessment.',
        completedDate: '',
      },
    };
    rerender(
      <ReactFlowProvider>
        <PieceNode {...props} data={{ ...props.data, piece: accomplishment }} />
      </ReactFlowProvider>,
    );
    expect(screen.getByText('ACCOMPLISHMENT / REALIZED')).toBeInTheDocument();
    expect(container.querySelector('[data-milestone="accomplishment"]')).toBeInTheDocument();
  });
  it('shows concise milestone details and honest owner-attested status without evidence', () => {
    const piece = {
      ...sampleWorkspace.pieces[0],
      title: 'Completed an English course',
      summary: 'Completed an English course.',
      area: 'english_communication' as const,
      stage: 'working' as const,
      milestone: {
        state: 'accomplishment' as const,
        achievement: 'Completed the English course.',
        description: 'The actual result is recorded plainly.',
        result: 'Completed the final assessment.',
        completedDate: '2026-10-19',
      },
      evidence: [],
    };
    render(
      <DetailPanel
        piece={piece}
        data={{ ...sampleWorkspace, pieces: [piece] }}
        onClose={() => {}}
        onSelect={() => {}}
        onExpand={() => {}}
        expanded={false}
      />,
    );
    expect(screen.getByText('Completed the English course.')).toBeInTheDocument();
    expect(screen.getByText('Completed the final assessment.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Owner-attested. No supporting material was supplied, so this is not independently verified.',
      ),
    ).toBeInTheDocument();
  });
  it('keeps milestone goals searchable and directly filterable in the index', () => {
    const goal = {
      ...sampleWorkspace.pieces[0],
      title: 'Achieve an IELTS target',
      summary: 'Goal: Achieve an IELTS target.',
      area: 'english_communication' as const,
      stage: 'blueprint' as const,
      milestone: {
        state: 'goal' as const,
        intention: 'Achieve an IELTS target',
        description: '',
        target: 'Record the actual qualifying result.',
        targetDate: '',
      },
      evidence: [],
    };
    render(
      <IndexPanel
        data={{ ...sampleWorkspace, pieces: [goal] }}
        onClose={() => {}}
        onSelect={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'goal' }));
    expect(screen.getByText('Achieve an IELTS target')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Search creations'), {
      target: { value: 'qualifying result' },
    });
    expect(screen.getByText('Achieve an IELTS target')).toBeInTheDocument();
  });
  it('never embeds a preview from an unapproved origin', () => {
    const piece = {
      ...sampleWorkspace.pieces[0],
      media: [{ kind: 'preview' as const, url: 'https://example.com/demo', alt: 'A preview' }],
    };
    const { container } = render(
      <DetailPanel
        piece={piece}
        data={sampleWorkspace}
        onClose={() => {}}
        onSelect={() => {}}
        onExpand={() => {}}
        expanded={false}
      />,
    );
    expect(container.querySelector('iframe')).toBeNull();
    expect(screen.getByRole('link', { name: /Open preview/ })).toBeInTheDocument();
  });
});
