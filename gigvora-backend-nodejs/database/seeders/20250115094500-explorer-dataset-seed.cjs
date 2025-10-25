'use strict';

const path = require('node:path');
const { randomUUID } = require('node:crypto');
const fs = require('fs-extra');

function normaliseArray(value) {
  if (!Array.isArray(value)) {
    return null;
  }
  const entries = value.map((item) => (item == null ? null : `${item}`.trim())).filter(Boolean);
  return entries.length ? entries : [];
}

function normaliseNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

module.exports = {
  async up(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      const datasetPath = path.join(process.cwd(), 'database', 'explorerData.json');
      const dataset = await fs.readJson(datasetPath).catch(() => ({}));
      const rows = [];
      const now = new Date();

      for (const [collection, records] of Object.entries(dataset || {})) {
        if (!Array.isArray(records) || !records.length) {
          continue;
        }

        for (const record of records) {
          const {
            id,
            category,
            title,
            summary,
            description,
            longDescription,
            status,
            organization,
            location,
            employmentType,
            duration,
            experienceLevel,
            availability,
            track,
            isRemote,
            skills,
            tags,
            price,
            heroImage,
            gallery,
            videoUrl,
            detailUrl,
            applicationUrl,
            rating,
            reviewCount,
            owner = {},
            geo = {},
            metadata,
            createdAt,
            updatedAt,
            ...rest
          } = record || {};

          const priceAmount = normaliseNumber(price?.amount);
          const lat = normaliseNumber(geo?.lat);
          const lng = normaliseNumber(geo?.lng);
          const extraMetadata = Object.keys(rest || {}).length ? rest : null;
          const recordMetadata = metadata != null ? metadata : extraMetadata;

          rows.push({
            id: id || randomUUID(),
            collection,
            category: category || collection.replace(/s$/, ''),
            title: title || 'Untitled record',
            summary: summary || description || '',
            description: description || summary || '',
            longDescription: longDescription || rest.longDescription || null,
            status: status || 'draft',
            organization: organization || null,
            location: location || null,
            employmentType: employmentType || null,
            duration: duration || null,
            experienceLevel: experienceLevel || null,
            availability: availability || null,
            track: track || null,
            isRemote: Boolean(isRemote),
            skills: normaliseArray(skills),
            tags: normaliseArray(tags),
            priceAmount,
            priceCurrency: price?.currency || null,
            priceUnit: price?.unit || null,
            heroImage: heroImage || null,
            gallery: normaliseArray(gallery),
            videoUrl: videoUrl || null,
            detailUrl: detailUrl || null,
            applicationUrl: applicationUrl || null,
            rating: normaliseNumber(rating),
            reviewCount: normaliseNumber(reviewCount),
            ownerName: owner.name || null,
            ownerRole: owner.role || null,
            ownerAvatar: owner.avatar || null,
            geoLat: lat,
            geoLng: lng,
            metadata: recordMetadata && Object.keys(recordMetadata).length ? recordMetadata : null,
            createdAt: createdAt ? new Date(createdAt) : now,
            updatedAt: updatedAt ? new Date(updatedAt) : now,
          });
        }
      }

      if (rows.length) {
        await queryInterface.bulkInsert('explorer_records', rows, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.bulkDelete('explorer_records', null, { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
