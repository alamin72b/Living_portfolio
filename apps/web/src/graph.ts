import { descendants, type Workspace } from '@blueprint/shared';
export function arrangedPositions(data: Workspace, expanded: string | null) {
  const positions = new Map(data.pieces.map((p) => [p.id, { ...p.position }]));
  if (!expanded) return positions;
  const parent = data.pieces.find((p) => p.id === expanded);
  if (!parent) return positions;
  const children = [...descendants(expanded, data.connections)].sort();
  children.forEach((id, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(children.length, 1) - Math.PI / 2;
    positions.set(id, {
      x: parent.position.x + Math.cos(angle) * 430,
      y: parent.position.y + Math.sin(angle) * 340,
    });
  });
  return positions;
}
