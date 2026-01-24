/***********************
 * UTILITY FUNCTIONS
 ***********************/

export function getColumnName(columnId) {
  switch (columnId) {
    case 'todo': return 'To Do';
    case 'inProgress': return 'In Progress';
    case 'done': return 'Done';
    case 'onHold': return 'On Hold';
    default: return '';
  }
}

export function getCurrentDate() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

export function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[s]));
}

export function formatTime(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  } else {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

export function getFirstLine(html) {
  if (!html) return 'No additional notes';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || '';
  const textTrimmed = text.trim();

  if (textTrimmed) {
    return textTrimmed;
  }

  const hasImages = tempDiv.querySelectorAll('img').length > 0;
  if (hasImages) {
    return 'Image attached';
  }

  return 'No additional notes';
}

export function getTextPreview(html) {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || '';
}

export function getImageDimensions(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      resolve({ width: 150, height: 100 });
    };
    img.src = src;
  });
}
