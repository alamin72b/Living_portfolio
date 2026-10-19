import { memo } from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { Node, NodeProps } from '@xyflow/react';
import type { Profile } from '@blueprint/shared';
export type IdentityFlowNode = Node<
  { profile: Profile; empty: boolean; sample: boolean; onSample: () => void; onIndex: () => void },
  'identity'
>;
export const IdentityNode = memo(function IdentityNode({ data }: NodeProps<IdentityFlowNode>) {
  return (
    <section className="identity-node">
      <div className="identity-kicker">
        <span className="little-cross" /> A WORKSPACE, ALWAYS IN THE MAKING
      </div>
      <h1>
        Nothing starts
        <br />
        fully <em>formed.</em>
      </h1>
      <div className="identity-rule" />
      <p className="identity-tagline">
        Everything grew from
        <br />
        something smaller.
      </p>
      <p className="identity-description">{data.profile.introduction}</p>
      <button
        className="identity-action nodrag"
        onClick={data.empty ? data.onSample : data.onIndex}
      >
        {data.empty
          ? 'See how pieces come together'
          : data.sample
            ? 'Explore the example pieces'
            : 'Find something to explore'}
        <ArrowUpRight size={18} />
      </button>
      <div className="identity-signoff">
        <span className="signature">Al Amin.</span>
        <span>
          {data.profile.name}
          <br />
          <span className="muted">
            {data.sample ? 'An illustrative workspace' : 'A living collection of genuine work'}
          </span>
        </span>
      </div>
      <div className="identity-caption">
        <ArrowDownRight size={20} />
        <span>
          {data.empty
            ? 'A quiet beginning. Room for what comes next.'
            : 'Pan to discover. Follow the connections.'}
        </span>
      </div>
    </section>
  );
});
