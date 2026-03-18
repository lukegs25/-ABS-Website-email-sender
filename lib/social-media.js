// Instagram (Meta Graph API) and LinkedIn posting helpers

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;
const LINKEDIN_BASE = 'https://api.linkedin.com/v2';

// ─── Instagram ────────────────────────────────────────────────────────────────

/**
 * Create an Instagram media container, then publish it.
 * imageUrl must be a publicly accessible URL.
 * mediaType: 'IMAGE' (feed) or 'STORIES'
 */
async function createInstagramContainer({ imageUrl, caption, mediaType = 'IMAGE' }) {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  const body = {
    image_url: imageUrl,
    access_token: token,
  };
  if (mediaType === 'STORIES') {
    body.media_type = 'STORIES';
  } else {
    body.caption = caption;
  }

  const res = await fetch(`${GRAPH_BASE}/${accountId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to create Instagram media container');
  }
  return data.id; // creation_id
}

async function publishInstagramContainer(creationId) {
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  const res = await fetch(`${GRAPH_BASE}/${accountId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: token }),
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error?.message || 'Failed to publish Instagram media');
  }
  return data.id; // published media id
}

export async function postInstagramFeed({ imageUrl, caption }) {
  const creationId = await createInstagramContainer({ imageUrl, caption, mediaType: 'IMAGE' });
  // Brief wait for container to be ready
  await new Promise(r => setTimeout(r, 3000));
  const postId = await publishInstagramContainer(creationId);
  return { postId };
}

export async function postInstagramStory({ imageUrl }) {
  const creationId = await createInstagramContainer({ imageUrl, mediaType: 'STORIES' });
  await new Promise(r => setTimeout(r, 3000));
  const postId = await publishInstagramContainer(creationId);
  return { postId };
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

/**
 * Register an image upload with LinkedIn and get an upload URL + asset URN.
 */
async function registerLinkedInImageUpload() {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgUrn = process.env.LINKEDIN_ORGANIZATION_URN; // urn:li:organization:XXXXXXX

  const res = await fetch(`${LINKEDIN_BASE}/assets?action=registerUpload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: orgUrn,
        serviceRelationships: [
          { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' },
        ],
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to register LinkedIn upload');
  const uploadUrl = data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = data.value.asset;
  return { uploadUrl, asset };
}

/**
 * Upload image bytes to LinkedIn's upload URL.
 * imageBuffer: Buffer or Uint8Array
 */
async function uploadLinkedInImage(uploadUrl, imageBuffer) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'image/png' },
    body: imageBuffer,
  });
  if (!res.ok) throw new Error('Failed to upload image to LinkedIn');
}

/**
 * Post to LinkedIn as an organization with an image.
 */
export async function postLinkedIn({ imageBuffer, caption }) {
  const token = process.env.LINKEDIN_ACCESS_TOKEN;
  const orgUrn = process.env.LINKEDIN_ORGANIZATION_URN;

  const { uploadUrl, asset } = await registerLinkedInImageUpload();
  await uploadLinkedInImage(uploadUrl, imageBuffer);

  const res = await fetch(`${LINKEDIN_BASE}/ugcPosts`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: orgUrn,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: caption },
          shareMediaCategory: 'IMAGE',
          media: [
            {
              status: 'READY',
              description: { text: caption.slice(0, 200) },
              media: asset,
              title: { text: 'ABS Event Flyer' },
            },
          ],
        },
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
      },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to post to LinkedIn');
  return { postId: data.id };
}

// ─── ISO week helper ──────────────────────────────────────────────────────────

export function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

export const COLOR_PALETTES = [
  { bg: '#1E3A5F', accent: '#F5A623', text: '#FFFFFF', name: 'Navy Gold' },
  { bg: '#2D6A4F', accent: '#95D5B2', text: '#FFFFFF', name: 'Forest Mint' },
  { bg: '#7B2D8B', accent: '#E8A0BF', text: '#FFFFFF', name: 'Purple Blush' },
  { bg: '#C1121F', accent: '#FFD60A', text: '#FFFFFF', name: 'Red Yellow' },
  { bg: '#023E8A', accent: '#48CAE4', text: '#FFFFFF', name: 'Royal Sky' },
  { bg: '#3D405B', accent: '#F2CC8F', text: '#FFFFFF', name: 'Slate Sand' },
  { bg: '#1B4332', accent: '#B7E4C7', text: '#FFFFFF', name: 'Deep Green' },
  { bg: '#4A0E8F', accent: '#FF6B6B', text: '#FFFFFF', name: 'Deep Purple Coral' },
];

export function getWeeklyPalette() {
  const week = getISOWeek(new Date());
  return COLOR_PALETTES[week % COLOR_PALETTES.length];
}
