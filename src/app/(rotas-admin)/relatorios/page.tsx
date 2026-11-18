'use client'

import * as xlsx from '@e965/xlsx';
import * as relatorioServices from '@/shared/services/relatorio.services';
import { Suspense, useEffect, useRef, useState } from "react"
import Content from '@/components/Content';
import { Box, Button, Checkbox, DialogTitle, FormControl, FormLabel, IconButton, Modal, ModalDialog, Select, Option, Stack, Table } from '@mui/joy';
import { Clear, FileDownload, Refresh } from '@mui/icons-material';
import { FaFilePdf, FaRegFileExcel, FaRegFilePdf } from 'react-icons/fa6';

export default function Relatorios(){
  return (
    <Suspense>
      <BuscaRelatorios />
    </Suspense>
  )
}

function BuscaRelatorios(){
  const tableRef = useRef<HTMLDivElement>(null);
  const tipos = ['', 'Elétrica', 'Hidráulica', 'Telefonia', 'Outros']

  const [ relatorio, setRelatorio ] = useState<string>("");
  const [ ano_inicio, setAnoInicio ] = useState<number>(2024);
  const [ ano_fim, setAnoFim ] = useState<number>(2024);
  const [ dataRelatorio, setDataRelatorio] = useState<any[][]>([]);
  const [ anos, setAnos ] = useState<number[]>([]);
  const [ totalPorTipo, setTotalPorTipo ] = useState<Record<string, number>>();
  const [ modalExportOpen, setModalExportOpen ] = useState<boolean>(false);
  const [ camposSelecionados, setCamposSelecionados ] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let anos = [];
    for (let i = 2024; i <= new Date().getFullYear(); i++){
      anos.push(i);
    }
    setAnos(anos);
  }, []);

  useEffect(() => {
    switch(relatorio){
      case "listarChamadosPeriodoAno":
        relatorioServices.listarChamadosPeriodoAno(ano_inicio, ano_fim)
        .then((response: relatorioServices.IChamadoPeriodoAno[]) => {
          if (!response) {
            setTotalPorTipo(undefined);
            setDataRelatorio([]);
            return;
          }
          const totalPorTipo: Record<string, number> = { 'Hidráulica': 0, 'Elétrica': 0, 'Telefonia': 0, 'Outros': 0 };
          response.forEach((row: relatorioServices.IChamadoPeriodoAno) => {
            if (row.Tipo && totalPorTipo.hasOwnProperty(row.Tipo)) {
              totalPorTipo[row.Tipo] += 1;
            }
          });
          setTotalPorTipo(totalPorTipo);
          const dataRelatorio = [];
          dataRelatorio.push([totalPorTipo]);
          dataRelatorio.push(response);
          setDataRelatorio(dataRelatorio);

        })
    }
  }, [relatorio, ano_inicio, ano_fim]);

  function downloadArquivo(tipo: string){
    switch (tipo){
      case "pdf":
        downloadPdf();
        break;
    }
  }

  function abrirModalExportXlsx(){
    if (dataRelatorio.length < 2 || dataRelatorio[1].length === 0) return;
    const campos = Object.keys(dataRelatorio[1][0]);
    const selecaoPadrao: Record<string, boolean> = {};
    campos.forEach((campo) => { selecaoPadrao[campo] = true; });
    setCamposSelecionados(selecaoPadrao);
    setModalExportOpen(true);
  }

  function confirmarExportXlsx(){
    const camposSelecionadosLista = Object.keys(camposSelecionados).filter((campo) => camposSelecionados[campo]);
    downloadXlsx(camposSelecionadosLista);
    setModalExportOpen(false);
  }

  function downloadXlsx(camposSelecionadosLista?: string[]){
    if (dataRelatorio.length === 0) return;
    const wb = xlsx.utils.book_new();
    var relatorios = 1;
    for (const tabela of dataRelatorio){
      if (tabela.length === 0) return;
      let dadosTabela = tabela;
      if (relatorios === 2 && camposSelecionadosLista && camposSelecionadosLista.length > 0){
        dadosTabela = tabela.map((linha: any) => {
          const linhaFiltrada: Record<string, any> = {};
          camposSelecionadosLista.forEach((campo) => { linhaFiltrada[campo] = linha[campo]; });
          return linhaFiltrada;
        });
      }
      const ws = xlsx.utils.json_to_sheet(dadosTabela);
      xlsx.utils.book_append_sheet(wb, ws, `Relatório_${relatorios}`);
      relatorios++;
    }
    xlsx.writeFile(wb, `${new Date().toLocaleDateString()}_${relatorio}_${ano_inicio}_${ano_fim}.xlsx`);
  }

  function downloadPdf(){
    if (!tableRef.current) return;

    const printContent = tableRef.current.innerHTML;
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); // Evita bugs na UI após a impressão
  }

  function atualizaPeriodoAno(ano: number, tipo: string){
    if (tipo === "inicio"){
      if (ano > ano_fim)
        setAnoFim(ano);
      setAnoInicio(ano);
    } else {
      if (ano < ano_inicio)
        setAnoInicio(ano);
      setAnoFim(ano);
    }
  }

  return <>
    <Content
      titulo="Relatórios"
      breadcrumbs={[{ label: 'Relatórios', href: '/relatorios' }]}
    >
      <Box
        className="SearchAndFilters-tabletUp"
        sx={{
          borderRadius: 'sm',
          py: 2,
          display: { sm: 'flex' },
          flexWrap: 'wrap',
          gap: 1.5,
          '& > *': {
            minWidth: { xs: '120px', md: '160px' },
          },
          alignItems: 'end',
        }}
      >
        <FormControl size="sm">
          <FormLabel>Relatório: </FormLabel>
          <Select
            value={relatorio}
            onChange={(e, value) => value && setRelatorio(value)}
            size="sm"
          >
            <Option value="listarChamadosPeriodoAno">Chamados por período (em anos)</Option>
          </Select>
        </FormControl>
        <Box sx={{ display: relatorio === "listarChamadosPeriodoAno" ? 'flex' : 'none', gap: 1 }}>
          <FormControl size="sm">
            <FormLabel>Ano inicial: </FormLabel>
            <Select
              value={ano_inicio}
              onChange={(e, value) => value && atualizaPeriodoAno(value, "inicio")}
              size="sm"
            >
              {anos.map((ano) => <Option key={ano} value={ano}>{ano}</Option>)}
            </Select>
          </FormControl>
          <FormControl size="sm">
            <FormLabel>Ano final: </FormLabel>
            <Select
              value={ano_fim}
              onChange={(e, value) => value && atualizaPeriodoAno(value, "fim")}
              size="sm"
            >
              {anos.map((ano) => <Option key={ano} value={ano}>{ano}</Option>)}
            </Select>
          </FormControl>
        </Box>
        <IconButton title="Baixar planilha" size="sm" color='success' sx={{ display: dataRelatorio.length > 0 ? 'flex' : 'none' }} onClick={() => { abrirModalExportXlsx() }}><FaRegFileExcel size={24} /></IconButton>
        <IconButton title="Baixar pdf" size="sm" color='danger' sx={{ display: dataRelatorio.length > 0 ? 'flex' : 'none' }} onClick={() => { downloadArquivo("pdf") }}><FaRegFilePdf size={24} /></IconButton>
      </Box>
      <div ref={tableRef}>
        { (relatorio === "listarChamadosPeriodoAno") && (
          <Box sx={{ display: dataRelatorio.length === 0 ? 'flex' : 'none', gap: 1.5, alignItems: 'center' }}>
          </Box>
        )}
        {dataRelatorio.length > 0 && dataRelatorio.map((tabela, index) => (
          <Table key={index} hoverRow sx={{ tableLayout: 'auto' }} id="table-relatorio">
            <thead>
              <tr>
                {tabela.length > 0 && Object.keys(tabela[0]).map((key) => <th key={key}>{key}</th>)}
              </tr>
            </thead>
            <tbody>
              {tabela.map((row, index) => (
                <tr key={index}>
                  {Object.values(row).map((value, index) => <td key={index}>{value as React.ReactNode}</td>)}
                </tr>
              ))}
            </tbody>
          </Table>
        ))}
      </div>
      <Modal open={modalExportOpen} sx={{ zIndex: 99 }} onClose={() => setModalExportOpen(false)}>
        <ModalDialog>
          <DialogTitle>Selecionar campos para exportação</DialogTitle>
          <Stack spacing={1} sx={{ my: 1, maxHeight: '60vh', overflowY: 'auto' }}>
            {Object.keys(camposSelecionados).map((campo) => (
              <Checkbox
                key={campo}
                label={campo || '(sem nome)'}
                checked={camposSelecionados[campo]}
                onChange={(e) => setCamposSelecionados((prev) => ({ ...prev, [campo]: e.target.checked }))}
              />
            ))}
          </Stack>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button variant="plain" color="neutral" onClick={() => setModalExportOpen(false)}>Cancelar</Button>
            <Button color="success" onClick={confirmarExportXlsx}>Exportar</Button>
          </Stack>
        </ModalDialog>
      </Modal>
    </Content>
  </>
}