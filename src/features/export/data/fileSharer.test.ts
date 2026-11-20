// SPDX-License-Identifier: Apache-2.0
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import { nativeFileSharer } from './fileSharer';

const { fs } = ReactNativeBlobUtil;

describe('nativeFileSharer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('replaces any earlier export, writes the file and shares it', async () => {
    jest.mocked(fs.exists).mockResolvedValueOnce(true);
    await nativeFileSharer.share({
      fileName: 'contractions-2026-01-10.csv',
      mimeType: 'text/csv',
      contents: 'start,end\r\n',
      encoding: 'utf8',
      title: 'Share contractions',
    });
    expect(fs.unlink).toHaveBeenCalledWith('/cache/exports');
    expect(fs.mkdir).toHaveBeenCalledWith('/cache/exports');
    expect(fs.writeFile).toHaveBeenCalledWith(
      '/cache/exports/contractions-2026-01-10.csv',
      'start,end\r\n',
      'utf8',
    );
    expect(Share.open).toHaveBeenCalledWith({
      url: 'file:///cache/exports/contractions-2026-01-10.csv',
      type: 'text/csv',
      filename: 'contractions-2026-01-10.csv',
      title: 'Share contractions',
      failOnCancel: false,
    });
  });

  it('clears exports only when the folder exists', async () => {
    jest.mocked(fs.exists).mockResolvedValueOnce(false);
    await nativeFileSharer.clearExports();
    expect(fs.unlink).not.toHaveBeenCalled();
  });
});
