const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * 1. GET /api/release-notes
 * Mengambil daftar seluruh release notes
 * - Superadmin / Admin / Owner: dapat melihat draft dan published
 * - User / Kasir: hanya melihat yang is_published: true
 */
const getReleaseNotes = async (req, res, next) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase();
    const isPrivileged = ['admin', 'superadmin', 'owner'].includes(userRole);
    const { published, search } = req.query;

    const where = {};

    if (!isPrivileged) {
      where.is_published = true;
    } else if (published === 'true') {
      where.is_published = true;
    } else if (published === 'false') {
      where.is_published = false;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { version: { contains: q } },
        { title: { contains: q } },
        { content: { contains: q } }
      ];
    }

    const releaseNotes = await prisma.releaseNote.findMany({
      where,
      orderBy: { created_at: 'desc' }
    });

    const counts = {
      total: releaseNotes.length,
      published: releaseNotes.filter(r => r.is_published).length,
      draft: releaseNotes.filter(r => !r.is_published).length
    };

    return res.json({
      success: true,
      data: releaseNotes,
      counts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/release-notes/latest
 * Mengambil 1 release note terbaru yang berstatus published (untuk pop-up login)
 */
const getLatestReleaseNote = async (req, res, next) => {
  try {
    const latestNote = await prisma.releaseNote.findFirst({
      where: { is_published: true },
      orderBy: { created_at: 'desc' }
    });

    return res.json({
      success: true,
      data: latestNote || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. POST /api/release-notes
 * Membuat release note baru (Superadmin / Admin / Owner only)
 */
const createReleaseNote = async (req, res, next) => {
  try {
    const { version, title, content, is_published } = req.body;

    if (!version || !version.trim()) {
      return res.status(400).json({ success: false, message: 'Nomor versi (contoh: v2.5.0) wajib diisi.' });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Judul pembaruan wajib diisi.' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Isi / konten rilis wajib diisi.' });
    }

    const authorId = req.user?.id || req.user?.user_id || null;
    const authorName = req.user?.name || 'Superadmin';

    const newNote = await prisma.releaseNote.create({
      data: {
        version: version.trim(),
        title: title.trim(),
        content: content.trim(),
        is_published: typeof is_published === 'boolean' ? is_published : true,
        author_id: authorId,
        author_name: authorName
      }
    });

    return res.status(201).json({
      success: true,
      message: `Release note ${newNote.version} berhasil dibuat!`,
      data: newNote
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PUT /api/release-notes/:id
 * Memperbarui release note (Superadmin / Admin / Owner only)
 */
const updateReleaseNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { version, title, content, is_published } = req.body;
    const noteId = parseInt(id, 10);

    const existing = await prisma.releaseNote.findUnique({
      where: { id: noteId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Release note tidak ditemukan.' });
    }

    const updated = await prisma.releaseNote.update({
      where: { id: noteId },
      data: {
        ...(version !== undefined ? { version: version.trim() } : {}),
        ...(title !== undefined ? { title: title.trim() } : {}),
        ...(content !== undefined ? { content: content.trim() } : {}),
        ...(is_published !== undefined ? { is_published: Boolean(is_published) } : {})
      }
    });

    return res.json({
      success: true,
      message: `Release note ${updated.version} berhasil diperbarui!`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. DELETE /api/release-notes/:id
 * Menghapus release note permanen (Superadmin / Admin / Owner only)
 */
const deleteReleaseNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const noteId = parseInt(id, 10);

    const existing = await prisma.releaseNote.findUnique({
      where: { id: noteId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Release note tidak ditemukan.' });
    }

    await prisma.releaseNote.delete({
      where: { id: noteId }
    });

    return res.json({
      success: true,
      message: `Release note ${existing.version} berhasil dihapus permanen.`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. PATCH /api/release-notes/:id/toggle-publish
 * Mengubah status publish/unpublish release note
 */
const togglePublishReleaseNote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const noteId = parseInt(id, 10);

    const existing = await prisma.releaseNote.findUnique({
      where: { id: noteId }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Release note tidak ditemukan.' });
    }

    const newStatus = !existing.is_published;
    const updated = await prisma.releaseNote.update({
      where: { id: noteId },
      data: { is_published: newStatus }
    });

    return res.json({
      success: true,
      message: `Release note ${updated.version} sekarang berstatus ${newStatus ? 'DIPUBLIKASIKAN (PUBLISHED)' : 'DRAFT'}.`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReleaseNotes,
  getLatestReleaseNote,
  createReleaseNote,
  updateReleaseNote,
  deleteReleaseNote,
  togglePublishReleaseNote
};
