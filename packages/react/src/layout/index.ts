import { assign, camelCase, compact, fromPairs, times, upperFirst } from 'es-toolkit/compat';
import { css } from 'goober';
import { divx } from '../div';
import { Layout } from './types';

const createArea = (name: string) => {
  return divx({}, css`
    display: grid;
    overflow: auto;
    width: 100%;
    height: 100%;
    grid-area: ${name};`);
};

interface Track {
  rows?: string;
  cols?: string;
}

const createMainLayout = (matrix: string[][], track?: Track) => {
  const gridTemplateAreas = matrix.map(
    row => `"${row.join(' ')}"`,
  ).join('\n');
  const trackRows = track?.rows ?? times(matrix.length, () => '1fr').join(' ');
  const trackCols = track?.cols ?? times(matrix[0].length, () => '1fr').join(' ');

  return divx({}, css`
    display: grid;
    overflow: auto;
    width: 100%;
    height: 100%;
    grid-template-areas: ${gridTemplateAreas};
    grid-template-rows: ${trackRows};
    grid-template-columns: ${trackCols};
    `);
};

const convertFormatToMatrix = (format: string): string[][] => {
  const rows = compact(
    format.split('\n').map(row => row.trim()),
  );
  const matrix = compact(
    rows.map(row => row.split(/\s+/)),
  );
  matrix.forEach(
    (row, i) => row.forEach(
      (col, j) => {
        if (col === '-') {
          matrix[i][j] = matrix[i][j - 1];
        }
        if (col === '+') {
          matrix[i][j] = matrix[i - 1][j];
        }
      },
    ),
  );
  return matrix;
};

export const layout = <S extends string>(format: S, track?: Track): Layout<S> => {
  const components = compact(
    format.split(/\s+/).filter(s => !['-', '+'].includes(s)),
  );
  const entries = components.map((comp, i) => {
    const name = upperFirst(camelCase(comp));
    return [name, createArea(comp)] as const;
  });
  const map = Object.fromEntries(entries);
  const matrix = convertFormatToMatrix(format);
  const Layout = createMainLayout(matrix, track);

  assign(Layout, map);

  return Layout as Layout<S>;
};
