/**
 * Webhook Routes — External Integration Endpoints
 * 
 * POST /api/webhooks/aurora   — Aurora Solar project sync
 * POST /api/webhooks/docusign — DocuSign envelope status
 * POST /api/webhooks/stripe   — Payment events
 */

import { Router, Request, Response } from 'express';
import { processEvent, type PipelineEvent } from '../events/pipeline';
import { supabase } from '../config/supabase';

const router = Router();

/**
 * POST /api/webhooks/aurora
 * Receive project data from Aurora Solar
 */
router.post('/aurora', async (req: Request, res: Response) => {
  try {
    const data = req.body;

    // Validate Aurora payload
    if (!data.project_id || !data.customer_name) {
      return res.status(400).json({ error: 'Missing required Aurora fields' });
    }

    // Check for existing import
    const { data: existing } = await supabase
      .from('aurora_imports')
      .select('id')
      .eq('aurora_project_id', data.project_id)
      .maybeSingle();

    if (existing) {
      return res.json({ status: 'duplicate', message: 'Already imported' });
    }

    // Process through pipeline
    const event: PipelineEvent = {
      type: 'AURORA_DATA_SYNCED',
      timestamp: new Date().toISOString(),
      actor: { userId: 'system', role: 'system', name: 'Aurora Webhook' },
      data: {
        aurora_project_id: data.project_id,
        system_size: data.system_size_kw,
        panel_count: data.panel_count,
        financier: data.financing_type,
        monthly_payment: data.monthly_payment,
        raw_payload: data,
      },
    };

    await processEvent(event);
    res.json({ status: 'imported', aurora_id: data.project_id });
  } catch (err) {
    console.error('Aurora webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/docusign
 * Receive envelope status updates from DocuSign
 */
router.post('/docusign', async (req: Request, res: Response) => {
  try {
    const { event: dsEvent, data } = req.body;

    if (dsEvent === 'envelope-completed') {
      const event: PipelineEvent = {
        type: 'DOCUMENT_SIGNED',
        timestamp: new Date().toISOString(),
        actor: { userId: 'system', role: 'system', name: 'DocuSign' },
        projectId: data.envelopeCustomFields?.projectId,
        data: {
          document_type: data.envelopeCustomFields?.documentType || 'agreement',
          signed_by: data.signers?.[0]?.email,
          signed_at: data.completedDateTime,
          document_url: data.documentUri,
          envelope_id: data.envelopeId,
        },
      };

      await processEvent(event);
    }

    res.json({ received: true });
  } catch (err) {
    console.error('DocuSign webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/webhooks/stripe
 * Receive payment events from Stripe
 */
router.post('/stripe', async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment_intent.succeeded') {
      const projectId = data.object?.metadata?.project_id;
      const milestoneIndex = data.object?.metadata?.milestone_index;

      if (projectId && milestoneIndex !== undefined) {
        const event: PipelineEvent = {
          type: 'FUND_RELEASE_APPROVED',
          timestamp: new Date().toISOString(),
          actor: { userId: 'system', role: 'system', name: 'Stripe' },
          projectId,
          data: {
            fund_release_id: data.object?.metadata?.fund_release_id,
            approved_by: 'system',
            payment_reference: data.object?.id,
            amount: data.object?.amount / 100,
          },
        };

        await processEvent(event);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
