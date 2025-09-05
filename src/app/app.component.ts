import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // <-- Importar para *ngIf e Pipes (currency, percent)
import { FormsModule } from '@angular/forms';   // <-- Importar para [(ngModel)]
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-root',
  standalone: true, // <-- O Angular CLI já deve ter colocado isso
  imports: [CommonModule, FormsModule, NgxMaskDirective ], // <-- A MÁGICA ACONTECE AQUI!
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // --- PARÂMETROS E REGRAS DA CCT ---
  readonly REAJUSTE_SALARIAL_PERC = 0.0576;
  readonly PLR_REGRA_BASICA_PERC = 0.54;
  readonly PLR_REGRA_BASICA_FIXO = 1960.82;
  readonly PLR_REGRA_BASICA_TETO = 10516.34;
  readonly PLR_PARCELA_ADICIONAL_FIXO = 3352.43;
  readonly PCR_ITAU_FIXO = 3515.00;
  readonly TAXA_NEGOCIAL_PERC = 0.015;

  readonly TABELA_IR_PLR = [
    { limite: 6677.55, aliquota: 0.0, deducao: 0.0 },
    { limite: 9922.28, aliquota: 0.075, deducao: 500.82 },
    { limite: 13167.00, aliquota: 0.15, deducao: 1244.99 },
    { limite: 16380.38, aliquota: 0.225, deducao: 2232.51 },
    { limite: Infinity, aliquota: 0.275, deducao: 3051.52 }
  ];

  // --- ENTRADAS DO USUÁRIO (ligadas ao HTML com ngModel) ---
  salarioBruto?: number;
  plrBrutaAnterior?: number;
  mesesTrabalhados: number = 12;

  // --- RESULTADOS DO CÁLCULO ---
  calculoFeito = false;
  resultado: any = {};

  // --- MÉTODOS ---
  calcularPLR(): void {
    if (!this.salarioBruto || !this.plrBrutaAnterior || !this.mesesTrabalhados) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const salarioReajustado = this.salarioBruto * (1 + this.REAJUSTE_SALARIAL_PERC);

    let regraBasicaCheia = (salarioReajustado * this.PLR_REGRA_BASICA_PERC) + this.PLR_REGRA_BASICA_FIXO;
    if (regraBasicaCheia > this.PLR_REGRA_BASICA_TETO) {
      regraBasicaCheia = this.PLR_REGRA_BASICA_TETO;
    }

    const proporcao = this.mesesTrabalhados / 12.0;
    const regraBasicaBruto = regraBasicaCheia * proporcao;
    const parcelaAdicionalBruta = this.PLR_PARCELA_ADICIONAL_FIXO * proporcao;
    const pcrItauBruto = this.PCR_ITAU_FIXO * proporcao;

    const plrCctBruta = regraBasicaBruto + parcelaAdicionalBruta;
    const totalBruto = plrCctBruta + pcrItauBruto;

    const impostoRenda = this.calcularImpostoRenda(plrCctBruta, this.plrBrutaAnterior);
    const taxaNegocial = totalBruto * this.TAXA_NEGOCIAL_PERC;
    const totalDescontos = impostoRenda + taxaNegocial;

    const totalLiquido = totalBruto - totalDescontos;

    this.resultado = {
      salarioReajustado,
      proporcao,
      regraBasicaBruto,
      parcelaAdicionalBruta,
      pcrItauBruto,
      totalBruto,
      impostoRenda,
      taxaNegocial,
      totalDescontos,
      totalLiquido
    };

    this.calculoFeito = true;
  }

  private calcularImpostoRenda(plrBrutaAtual: number, plrBrutaAnterior: number): number {
    const irPagoAnteriormente = this.calcularImpostoFaixa(plrBrutaAnterior);
    const baseTotalAnual = plrBrutaAtual + plrBrutaAnterior;
    const irTotalDevidoAno = this.calcularImpostoFaixa(baseTotalAnual);
    const irDestaParcela = irTotalDevidoAno - irPagoAnteriormente;
    return irDestaParcela > 0 ? irDestaParcela : 0;
  }

  private calcularImpostoFaixa(valorBase: number): number {
    for (const faixa of this.TABELA_IR_PLR) {
      if (valorBase <= faixa.limite) {
        return (valorBase * faixa.aliquota) - faixa.deducao;
      }
    }
    return 0;
  }
}
