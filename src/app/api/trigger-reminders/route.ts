import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Disparando processamento de lembretes...');

    // Chamar API de processamento de lembretes
    const processResponse = await fetch(
      `${request.nextUrl.origin}/api/process-reminders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const processResult = await processResponse.json();

    if (!processResponse.ok) {
      console.error('❌ Erro ao processar lembretes:', processResult);
      return NextResponse.json(
        { 
          success: false, 
          error: processResult.error || 'Erro ao processar lembretes',
          details: processResult.details
        },
        { status: 500 }
      );
    }

    console.log('✅ Lembretes processados:', processResult);

    return NextResponse.json({
      success: true,
      message: 'Lembretes processados com sucesso',
      result: processResult
    });

  } catch (error: any) {
    console.error('💥 Erro ao disparar lembretes:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        details: 'Erro interno do servidor'
      },
      { status: 500 }
    );
  }
}

// Endpoint GET para verificar status dos lembretes
export async function GET(request: NextRequest) {
  try {
    // Chamar API de status de lembretes
    const statusResponse = await fetch(
      `${request.nextUrl.origin}/api/process-reminders`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const statusResult = await statusResponse.json();

    return NextResponse.json(statusResult);

  } catch (error: any) {
    console.error('💥 Erro ao verificar status dos lembretes:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message
      },
      { status: 500 }
    );
  }
}