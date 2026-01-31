// components/ActivitiesSection.jsx
import React, { useState, useEffect, useContext } from 'react';
import { 
  FiUpload, 
  FiDownload, 
  FiFile, 
  FiImage, 
  FiFileText, 
  FiVideo, 
  FiMusic, 
  FiArchive,
  FiMessageSquare,
  FiTrash2,
  FiUser,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo
} from 'react-icons/fi';
import { AuthContext } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ActivitiesSection = ({ workspaceId }) => {
  const { profile } = useContext(AuthContext);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileDescription, setFileDescription] = useState('');
  const [commentInput, setCommentInput] = useState({});
  const [activeFileId, setActiveFileId] = useState(null);

  const isAdmin = profile?.role === 'admin';

  // Toast notifications
  const showSuccess = (message) => toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });

  const showError = (message) => toast.error(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });

  const showInfo = (message) => toast.info(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });

  // Fetch files
  const fetchFiles = async () => {
    try {
      setLoading(true);
      
      // Get files with basic info
      const { data: filesData, error: filesError } = await supabase
        .from('activity_files')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (filesError) {
        console.error('Files fetch error:', filesError);
        showError('Failed to load files');
        return;
      }

      if (!filesData || filesData.length === 0) {
        setFiles([]);
        return;
      }

      // For each file, get additional data
      const filesWithDetails = await Promise.all(
        filesData.map(async (file) => {
          try {
            // Get comments - use simpler query
            const { data: commentsData, error: commentsError } = await supabase
              .from('file_comments')
              .select('*')
              .eq('file_id', file.id)
              .order('created_at', { ascending: false });

            if (commentsError) {
              console.error('Comments fetch error:', commentsError);
              // Continue with empty comments
            }

            // Get user info for comments
            const commentsWithUsers = await Promise.all(
              (commentsData || []).map(async (comment) => {
                try {
                  const { data: userData } = await supabase
                    .from('profiles')
                    .select('name')
                    .eq('id', comment.user_id)
                    .single();

                  return {
                    ...comment,
                    user: userData ? { name: userData.name } : { name: 'User' }
                  };
                } catch (error) {
                  return {
                    ...comment,
                    user: { name: 'User' }
                  };
                }
              })
            );

            // Get uploader info
            let uploaderName = 'User';
            try {
              const { data: uploaderData } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', file.user_id)
                .single();

              if (uploaderData?.name) {
                uploaderName = uploaderData.name;
              }
            } catch (error) {
              console.error('Uploader fetch error:', error);
            }

            // Get download count
            let downloadCount = 0;
            try {
              const { count } = await supabase
                .from('file_downloads')
                .select('*', { count: 'exact', head: true })
                .eq('file_id', file.id);

              downloadCount = count || 0;
            } catch (error) {
              console.error('Download count error:', error);
            }

            return {
              ...file,
              user: { name: uploaderName },
              comments: commentsWithUsers || [],
              download_count: downloadCount
            };
          } catch (error) {
            console.error('Error processing file:', file.id, error);
            return {
              ...file,
              user: { name: 'User' },
              comments: [],
              download_count: 0
            };
          }
        })
      );

      setFiles(filesWithDetails);
    } catch (error) {
      console.error('Error fetching files:', error);
      showError('Failed to load files. Please try again.');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      fetchFiles();
    }
  }, [workspaceId]);

  // Handle file upload
  const handleFileUpload = async () => {
    if (!selectedFile || !isAdmin) return;

    setUploading(true);
    try {
      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (selectedFile.size > maxSize) {
        showError('File size should be less than 50MB');
        setUploading(false);
        return;
      }

      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${workspaceId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('activities')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('activities')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const fileData = {
        workspace_id: workspaceId,
        user_id: profile.id,
        file_name: selectedFile.name,
        file_url: publicUrl,
        file_path: filePath,
        file_type: fileExt,
        file_size: selectedFile.size,
        mime_type: selectedFile.type,
        description: fileDescription
      };

      const { error: dbError } = await supabase
        .from('activity_files')
        .insert([fileData]);

      if (dbError) {
        console.error('Database error:', dbError);
        
        // Try to delete the uploaded file if database insert fails
        await supabase.storage
          .from('activities')
          .remove([filePath]);
          
        throw new Error(`Database error: ${dbError.message}`);
      }

      // Refresh files list
      await fetchFiles();
      
      // Reset form
      setSelectedFile(null);
      setFileDescription('');
      setShowUploadModal(false);
      
      showSuccess('File uploaded successfully!');
      
    } catch (error) {
      console.error('Upload error:', error);
      showError(error.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  // Handle file download
  const handleDownload = async (file) => {
    try {
      setActiveFileId(file.id);
      
      // Track download
      await supabase
        .from('file_downloads')
        .insert([{
          file_id: file.id,
          user_id: profile.id
        }]);

      // Create download link
      const link = document.createElement('a');
      link.href = file.file_url;
      link.download = file.file_name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Update download count locally
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === file.id
            ? { ...f, download_count: f.download_count + 1 }
            : f
        )
      );

      showInfo('Download started');
    } catch (error) {
      console.error('Download error:', error);
      showError('Failed to download file');
    } finally {
      setActiveFileId(null);
    }
  };

  // Add comment to file
  const addComment = async (fileId) => {
    const commentText = commentInput[fileId];
    if (!commentText?.trim()) {
      showInfo('Please enter a comment');
      return;
    }

    try {
      setActiveFileId(fileId);
      
      const { error } = await supabase
        .from('file_comments')
        .insert([{
          file_id: fileId,
          user_id: profile.id,
          comment: commentText
        }]);

      if (error) throw error;

      // Refresh files list to get updated comments
      await fetchFiles();
      
      // Clear input
      setCommentInput(prev => ({ ...prev, [fileId]: '' }));
      
      showSuccess('Comment added successfully!');
    } catch (error) {
      console.error('Comment error:', error);
      showError('Failed to add comment');
    } finally {
      setActiveFileId(null);
    }
  };

  // Delete file (admin only)
  const deleteFile = async (fileId) => {
    if (!isAdmin) {
      showError('Only admins can delete files');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      setActiveFileId(fileId);
      
      // Get file path first
      const file = files.find(f => f.id === fileId);
      
      if (!file) {
        showError('File not found');
        return;
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('activities')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database (cascade should delete comments and downloads)
      const { error: dbError } = await supabase
        .from('activity_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      // Update local state
      setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
      
      showSuccess('File deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      showError('Failed to delete file');
    } finally {
      setActiveFileId(null);
    }
  };

  // Get file icon
  const getFileIcon = (file) => {
    if (file.mime_type?.startsWith('image/')) 
      return <FiImage className="w-6 h-6 text-purple-600" />;
    if (file.mime_type?.startsWith('video/')) 
      return <FiVideo className="w-6 h-6 text-purple-600" />;
    if (file.mime_type?.startsWith('audio/')) 
      return <FiMusic className="w-6 h-6 text-purple-600" />;
    
    const fileType = file.file_type?.toLowerCase();
    switch (fileType) {
      case 'pdf':
        return <FiFileText className="w-6 h-6 text-purple-600" />;
      case 'doc':
      case 'docx':
        return <FiFileText className="w-6 h-6 text-purple-600" />;
      case 'zip':
      case 'rar':
      case '7z':
        return <FiArchive className="w-6 h-6 text-purple-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'svg':
        return <FiImage className="w-6 h-6 text-purple-600" />;
      default:
        return <FiFile className="w-6 h-6 text-purple-600" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
        <p className="text-gray-600">Loading files...</p>
        <p className="text-sm text-gray-400 mt-1">Please wait</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      
      <div className="p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Activities & Files</h2>
              <p className="text-gray-600 mt-1">
                {isAdmin 
                  ? 'Upload and manage shared documents' 
                  : 'View and download files shared by admin'}
              </p>
            </div>
            
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 shadow-sm"
              >
                <FiUpload className="w-4 h-4" />
                Upload File
              </button>
            )}
          </div>
          
          {files.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <FiInfo className="w-4 h-4" />
              <span>
                {files.length} file{files.length !== 1 ? 's' : ''} shared • {isAdmin ? 'You can upload and delete files' : 'You can view and comment on files'}
              </span>
            </div>
          )}
        </div>

        {/* Files Grid */}
        {files.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-xl border border-purple-100 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* File Header */}
                <div className="p-4 border-b border-purple-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-1 flex-shrink-0">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate" title={file.file_name}>
                          {file.file_name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 bg-purple-50 px-2 py-0.5 rounded">
                            {formatFileSize(file.file_size)}
                          </span>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs text-gray-500" title={formatDate(file.created_at)}>
                            {new Date(file.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <button
                        onClick={() => deleteFile(file.id)}
                        disabled={activeFileId === file.id}
                        className="ml-2 p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                        title="Delete file"
                      >
                        {activeFileId === file.id ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          <FiTrash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                  
                  {file.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {file.description}
                    </p>
                  )}
                </div>

                {/* File Info */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center">
                        <FiUser className="w-3 h-3 text-purple-600" />
                      </div>
                      <span className="text-sm text-gray-700">{file.user?.name}</span>
                    </div>
                    
                    <button
                      onClick={() => handleDownload(file)}
                      disabled={activeFileId === file.id}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-600 rounded-lg hover:from-purple-100 hover:to-indigo-100 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {activeFileId === file.id ? (
                        <>
                          <FiLoader className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs font-medium">Redirecting...</span>
                        </>
                      ) : (
                        <>
                          <FiDownload className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">Redirect To Image</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <FiDownload className="w-3.5 h-3.5" />
                      <span>{file.download_count} download{file.download_count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <FiMessageSquare className="w-3.5 h-3.5" />
                      <span>{file.comments.length} comment{file.comments.length !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="border-t border-purple-100">
                  {/* Add Comment */}
                  <div className="p-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput[file.id] || ''}
                        onChange={(e) => setCommentInput(prev => ({
                          ...prev,
                          [file.id]: e.target.value
                        }))}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 text-sm border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        onKeyPress={(e) => e.key === 'Enter' && addComment(file.id)}
                        disabled={activeFileId === file.id}
                      />
                      <button
                        onClick={() => addComment(file.id)}
                        disabled={activeFileId === file.id || !commentInput[file.id]?.trim()}
                        className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {activeFileId === file.id ? (
                          <FiLoader className="w-4 h-4 animate-spin" />
                        ) : (
                          'Post'
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  {file.comments.length > 0 && (
                    <div className="px-4 pb-4 max-h-48 overflow-y-auto">
                      {file.comments.map((comment) => (
                        <div key={comment.id} className="mb-3 last:mb-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm text-gray-900">
                              {comment.user?.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(comment.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 bg-purple-50 rounded-lg p-3">
                            {comment.comment}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 border-2 border-dashed border-purple-300 rounded-xl bg-gradient-to-b from-purple-50 to-white">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center">
              <FiFile className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No files yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {isAdmin 
                ? 'Share your first document with the team. Upload files, images, or videos to get started.' 
                : 'Files will appear here when the admin shares documents with the team.'}
            </p>
            {isAdmin && (
              <button
                onClick={() => setShowUploadModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2 mx-auto shadow-md"
              >
                <FiUpload className="w-5 h-5" />
                Upload Your First File
              </button>
            )}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fadeIn">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Upload File</h3>
                    <p className="text-sm text-gray-500 mt-1">Share file with workspace members</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setFileDescription('');
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={uploading}
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select File *
                  </label>
                  <div className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                    {selectedFile ? (
                      <div className="text-left">
                        <div className="flex items-center gap-3 mb-3">
                          {getFileIcon({ 
                            mime_type: selectedFile.type,
                            file_type: selectedFile.name.split('.').pop()
                          })}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(selectedFile.size)}
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-gray-100 rounded"
                            disabled={uploading}
                          >
                            <FiAlertCircle className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                        <button
                          onClick={() => document.getElementById('file-input').click()}
                          className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                          disabled={uploading}
                        >
                          Choose different file
                        </button>
                      </div>
                    ) : (
                      <>
                        <FiUpload className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-2">Drag & drop files here or</p>
                        <button
                          onClick={() => document.getElementById('file-input').click()}
                          className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors font-medium"
                          disabled={uploading}
                        >
                          Browse Files
                        </button>
                        <p className="text-xs text-gray-500 mt-3">
                          Max file size: 50MB
                        </p>
                      </>
                    )}
                    <input
                      id="file-input"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      className="hidden"
                      disabled={uploading}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={fileDescription}
                    onChange={(e) => setFileDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    rows="3"
                    placeholder="Add a description for this file..."
                    disabled={uploading}
                  />
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                      setFileDescription('');
                    }}
                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFileUpload}
                    disabled={!selectedFile || uploading}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <FiLoader className="w-4 h-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload File'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ActivitiesSection;