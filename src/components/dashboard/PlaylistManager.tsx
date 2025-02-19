'use client';

import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { listMediaFiles, MediaFile, Playlist, PlaylistItem, createPlaylist, updatePlaylist, listPlaylists, deletePlaylist } from '@/lib/dynamodb';
import { getSignedFileUrl } from '@/lib/s3';

function MediaPreview({ file, size = "small" }: { file: MediaFile, size?: "small" | "large" }) {
  const [signedUrl, setSignedUrl] = useState<string>('');

  useEffect(() => {
    async function generateSignedUrl() {
      try {
        const urlParts = file.fileUrl.split('/');
        const key = urlParts.slice(3).join('/');
        const url = await getSignedFileUrl(key);
        setSignedUrl(url);
      } catch (error) {
        console.error('Error generating signed URL:', error);
      }
    }

    generateSignedUrl();
  }, [file]);

  if (!signedUrl) {
    return (
      <div className={`${size === "small" ? "w-32 h-18" : "w-full h-40"} bg-gray-800 rounded flex items-center justify-center`}>
        <span className="text-gray-400 text-xs">Loading...</span>
      </div>
    );
  }

  const isVideo = file.fileType.startsWith('video/');

  return (
    <div className={`${size === "small" ? "w-32 h-18" : "w-full h-40"} bg-gray-800 rounded overflow-hidden`}>
      {isVideo ? (
        <div className="relative w-full h-full">
          <img
            src={signedUrl}
            alt={file.displayName || file.fileName}
            className="w-full h-full object-cover"
            onError={() => {
              console.log('Video thumbnail failed to load');
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <svg
              className="w-8 h-8 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18c.62-.39.62-1.29 0-1.69L9.54 5.98C8.87 5.55 8 6.03 8 6.82z" />
            </svg>
          </div>
        </div>
      ) : (
        <img
          src={signedUrl}
          alt={file.displayName || file.fileName}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" fill="%23666">Error</text></svg>';
          }}
        />
      )}
    </div>
  );
}

function SortableItem({ 
  item, 
  onDurationChange 
}: { 
  item: PlaylistItem;
  onDurationChange: (id: string, duration: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const isVideo = item.mediaFile.fileType.startsWith('video/');

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-start p-4 bg-gray-800 rounded-md shadow-lg mb-3 hover:bg-gray-750 transition-colors"
    >
      <MediaPreview file={item.mediaFile} size="small" />
      <div className="ml-4 flex-1">
        <p className="font-medium text-gray-200">{item.mediaFile.displayName || item.mediaFile.fileName}</p>
        {item.mediaFile.description && (
          <p className="text-sm text-gray-400 mt-1">{item.mediaFile.description}</p>
        )}
        {!isVideo && (
          <div className="mt-2">
            <input
              type="number"
              value={item.duration || 10}
              onChange={(e) => onDurationChange(item.id, parseInt(e.target.value) || 10)}
              className="w-20 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-gray-200 focus:outline-none focus:border-blue-500"
              min="1"
            />
            <span className="ml-1 text-gray-400">seconds</span>
          </div>
        )}
        {isVideo && (
          <p className="text-sm text-gray-400 mt-2">Full video duration</p>
        )}
      </div>
    </div>
  );
}

export default function PlaylistManager() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    Promise.all([
      loadMediaFiles(),
      loadPlaylists()
    ]).finally(() => setLoading(false));
  }, []);

  const loadMediaFiles = async () => {
    try {
      const files = await listMediaFiles();
      setMediaFiles(files);
    } catch (error) {
      console.error('Error loading media files:', error);
    }
  };

  const loadPlaylists = async () => {
    try {
      const loadedPlaylists = await listPlaylists();
      setPlaylists(loadedPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await deletePlaylist(playlistId);
      setPlaylists(playlists.filter(p => p.id !== playlistId));
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Failed to delete playlist. Please try again.');
    }
  };

  const createNewPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    const newPlaylist: Playlist = {
      id: `playlist-${Date.now()}`,
      name: newPlaylistName,
      items: [],
      userId: 'current-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await createPlaylist(newPlaylist);
      setPlaylists([...playlists, newPlaylist]);
      setNewPlaylistName('');
      setSelectedPlaylist(newPlaylist);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist. Please try again.');
    }
  };

  const addMediaToPlaylist = async (mediaFile: MediaFile) => {
    if (!selectedPlaylist) return;
  
    // Clean the mediaFile object to remove any undefined values
    const cleanMediaFile = {
      ...mediaFile,
      displayName: mediaFile.displayName || mediaFile.fileName,
      description: mediaFile.description || '',
    };
  
    const newItem: PlaylistItem = {
      id: `item-${Date.now()}`,
      mediaFile: cleanMediaFile,
      duration: mediaFile.fileType.startsWith('image/') ? 10 : null // Change undefined to null
    };
  
    const updatedPlaylist = {
      ...selectedPlaylist,
      items: [...selectedPlaylist.items, newItem],
      updatedAt: new Date().toISOString()
    };
  
    try {
      await updatePlaylist(updatedPlaylist);
      setSelectedPlaylist(updatedPlaylist);
      setPlaylists(playlists.map(p => 
        p.id === updatedPlaylist.id ? updatedPlaylist : p
      ));
    } catch (error) {
      console.error('Error updating playlist:', error);
      alert('Failed to update playlist. Please try again.');
    }
  };

  const handleDurationChange = async (itemId: string, newDuration: number) => {
    if (!selectedPlaylist) return;

    const updatedItems = selectedPlaylist.items.map(item =>
      item.id === itemId ? { ...item, duration: newDuration } : item
    );

    const updatedPlaylist = {
      ...selectedPlaylist,
      items: updatedItems,
      updatedAt: new Date().toISOString()
    };

    try {
      await updatePlaylist(updatedPlaylist);
      setSelectedPlaylist(updatedPlaylist);
      setPlaylists(playlists.map(p => 
        p.id === updatedPlaylist.id ? updatedPlaylist : p
      ));
    } catch (error) {
      console.error('Error updating playlist:', error);
      alert('Failed to update playlist duration. Please try again.');
    }
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id && selectedPlaylist) {
      const oldIndex = selectedPlaylist.items.findIndex(item => item.id === active.id);
      const newIndex = selectedPlaylist.items.findIndex(item => item.id === over.id);

      const updatedPlaylist = {
        ...selectedPlaylist,
        items: arrayMove(selectedPlaylist.items, oldIndex, newIndex),
        updatedAt: new Date().toISOString()
      };

      try {
        await updatePlaylist(updatedPlaylist);
        setSelectedPlaylist(updatedPlaylist);
        setPlaylists(playlists.map(p => 
          p.id === updatedPlaylist.id ? updatedPlaylist : p
        ));
      } catch (error) {
        console.error('Error updating playlist order:', error);
        alert('Failed to update playlist order. Please try again.');
      }
    }
  };

  if (loading) {
    return <div className="p-4 text-gray-200">Loading...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-900">
      {/* Playlist List */}
      <div className="w-64 border-r border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
            placeholder="New Playlist Name"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={createNewPlaylist}
            className="w-full mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Playlist
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {playlists.map(playlist => (
              <div key={playlist.id} className="flex items-center group">
                <button
                  onClick={() => setSelectedPlaylist(playlist)}
                  className={`flex-1 px-4 py-2 text-left rounded-l-md ${
                    selectedPlaylist?.id === playlist.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {playlist.name}
                </button>
                <button
                  onClick={() => handleDeletePlaylist(playlist.id)}
                  className="px-2 py-2 bg-red-500 text-white rounded-r-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Playlist Editor */}
      <div className="flex-1 flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-gray-200">
            {selectedPlaylist ? selectedPlaylist.name : 'Select a Playlist'}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedPlaylist ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedPlaylist.items}
                strategy={verticalListSortingStrategy}
              >
                {selectedPlaylist.items.map(item => (
                  <SortableItem 
                    key={item.id} 
                    item={item} 
                    onDurationChange={handleDurationChange}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center text-gray-400 mt-8">
              Select or create a playlist to begin
            </div>
          )}
        </div>
      </div>

      {/* Media Library */}
      <div className="w-72 border-l border-gray-700 flex flex-col h-full">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-medium text-gray-200">Media Library</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {mediaFiles.map(file => (
              <div
                key={file.mediaId}
                onClick={() => addMediaToPlaylist(file)}
                className="p-3 bg-gray-800 rounded-md cursor-pointer hover:bg-gray-750 transition-colors"
              >
                <MediaPreview file={file} size="large" />
                    <p className="mt-2 text-sm text-gray-200 font-medium truncate">
                      {file.displayName || file.fileName}
                    </p>
                    {file.description && (
                      <p className="text-xs text-gray-400 truncate mt-1">{file.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }